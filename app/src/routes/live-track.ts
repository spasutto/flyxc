import csurf from 'csurf';
import express, { Request, Response, Router } from 'express';
import { LiveDifferentialTrackGroup } from 'flyxc/common/protos/live-track';
import { SecretKeys } from 'flyxc/common/src/keys';
import { INCREMENTAL_UPDATE_SEC } from 'flyxc/common/src/live-track';
import {
  LIVE_TRACK_TABLE,
  retrieveLiveTrackByGoogleId,
  TrackerEntity,
  UpdateLiveTrackEntityFromModel,
} from 'flyxc/common/src/live-track-entity';
import { AccountFormModel, AccountModel, TrackerModel } from 'flyxc/common/src/models';
import { Keys } from 'flyxc/common/src/redis';
import { Validator } from 'flyxc/common/src/vaadin/form/Validation';
import { getFlyMeId } from 'flyxc/fetcher/src/trackers/flyme';
import { Redis } from 'ioredis';

/* eslint-disable @typescript-eslint/no-var-requires */
import { Datastore } from '@google-cloud/datastore';
import { NoDomBinder } from '@vaadin/form/NoDomBinder';

import { getUserInfo, isLoggedIn } from './session';

const datastore = new Datastore();
const csrfProtection = csurf();

export function getTrackerRouter(redis: Redis): Router {
  const router = express.Router();

  // Get the geojson for the currently active trackers.
  router.get('/_livetracks', async (req: Request, res: Response) => {
    res.set('Cache-Control', 'no-store');
    const token = req.header('token');
    if (!token) {
      // Pick the incremental proto if last request was recent.
      const timeSec = req.query.s ?? 0;
      const incrementalAfter = Date.now() / 1000 - INCREMENTAL_UPDATE_SEC + 60;
      const key = timeSec > incrementalAfter ? Keys.fetcherIncrementalProto : Keys.fetcherFullProto;
      res.set('Content-Type', 'application/x-protobuf');
      res.send(await redis.getBuffer(key));
    } else {
      switch (token) {
        case SecretKeys.FLYME_TOKEN:
          const groupProto = await redis.getBuffer(Keys.fetcherExportFlymeProto);
          if (req.header('accept') == 'application/json') {
            const track = LiveDifferentialTrackGroup.fromBinary(groupProto);
            res.json(LiveDifferentialTrackGroup.toJson(track));
          } else {
            res.set('Content-Type', 'application/x-protobuf');
            res.send(groupProto);
          }
          break;
        default:
          res.sendStatus(400);
      }
    }
  });

  // Get the account information.
  router.get('/_account', csrfProtection, async (req: Request, res: Response) => {
    res.set('Cache-Control', 'no-store');
    if (!isLoggedIn(req)) {
      res.sendStatus(403);
      return;
    }

    try {
      const userInfo = getUserInfo(req);
      if (!userInfo) {
        res.sendStatus(500);
        return;
      }

      const { name, token } = userInfo;
      let account: AccountModel;
      const entity = await retrieveLiveTrackByGoogleId(token);

      if (!entity) {
        account = AccountFormModel.createEmptyValue();
        account.name = name;
      } else {
        account = AccountFormModel.createFromEntity(entity);
      }

      res.set('xsrf-token', req.csrfToken());
      res.json(account);
    } catch (e) {
      res.sendStatus(400);
    }
  });

  // Updates the tracker information.
  router.post('/_account', csrfProtection, async (req: Request, res: Response) => {
    if (!isLoggedIn(req)) {
      res.sendStatus(403);
      return;
    }

    try {
      const userInfo = getUserInfo(req);
      if (!userInfo) {
        res.sendStatus(500);
        return;
      }
      const { email, token } = userInfo;

      let entity = await retrieveLiveTrackByGoogleId(token);

      const account: AccountModel = req.body;
      const binder = new NoDomBinder(AccountFormModel);
      binder.read(account);

      const model = binder.model;
      binder.for(model.flyme).addValidator(new FlyMeValidator(entity?.flyme));

      // Sends error to the client.
      const validationErrorData = (await binder.validate()).map(({ property, message }) => ({
        parameterName: property,
        message,
      }));

      if (validationErrorData.length) {
        res.json({
          error: `The form contains invalid values!`,
          validationErrorData,
        });
        return;
      }

      entity = UpdateLiveTrackEntityFromModel(entity, account, email, token);

      try {
        await datastore.save({
          key: entity[Datastore.KEY] ?? datastore.key([LIVE_TRACK_TABLE]),
          data: entity,
          excludeFromIndexes: ['track'],
        });
        // Sends a command to the fetcher to sync from the DB.
        await redis.incr(Keys.fetcherCmdSyncIncCount);
      } catch (e) {
        console.error(`Error saving the account ${email}`);
        res.json({ error: `An error has occurred, please try again later.` });
        return;
      }

      res.json({ error: false });
    } catch (e) {
      console.error(`Error updating an account: ${e}`);
      res.sendStatus(400);
    }
  });

  return router;
}

// Validates a Flyme account.
//
// Fetches the ID from the server when the device is enabled and config has changed.
class FlyMeValidator implements Validator<TrackerModel> {
  public message = '';
  private currentEnabled = false;
  private currentAccount = '';

  constructor(flyme: TrackerEntity | undefined) {
    if (flyme != null) {
      this.currentAccount = flyme.account;
      this.currentEnabled = flyme.enabled;
    }
  }

  async validate(tracker: TrackerModel) {
    if (tracker.enabled) {
      if (tracker.enabled === this.currentEnabled && tracker.account === this.currentAccount) {
        // No need to resolve again when not changing.
        return true;
      }

      try {
        tracker.account_resolved = await getFlyMeId(tracker.account);
        return true;
      } catch (e) {
        this.message = `${e}`;
        return { property: 'account' };
      }
    } else {
      // Clear the resolved account when disabled.
      tracker.account_resolved = '';
      return true;
    }
  }
}
