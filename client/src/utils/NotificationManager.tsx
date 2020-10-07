import React from 'react';
import EventEmitter from 'events';
import { getRandomActionId, planetCanUpgrade } from './Utils';
import {
  EthTxStatus,
  SubmittedTx,
  UnconfirmedTx,
} from '../_types/darkforest/api/ContractsAPITypes';
import { EthIcon } from '../app/Icons';
import {
  CenterChunkLink,
  FAQ04Link,
  PlanetNameLink,
  TxLink,
} from '../components/Text';
import { ExploredChunkData, Planet } from '../_types/global/GlobalTypes';
import dfstyles from '../styles/dfstyles.bs.js';

export enum NotificationType {
  Tx,
  CanUpgrade,
  BalanceEmpty,

  // should only ever happen once
  WelcomePlayer,
  FoundSpace,
  FoundDeepSpace,
  FoundPirates,
  FoundSilver,
  FoundComet,
}

export type NotificationInfo = {
  type: NotificationType;
  message: React.ReactNode;
  icon: React.ReactNode;
  id: string;
  color?: string;
  txData?: UnconfirmedTx;
  txStatus?: EthTxStatus;
};

export enum NotificationManagerEvent {
  Notify = 'Notify',
}

const getNotifColor = (
  type: NotificationType,
  txStatus?: EthTxStatus
): string | undefined => {
  if (type === NotificationType.Tx) {
    if (txStatus === EthTxStatus.Init) return dfstyles.colors.dfblue;
    else if (txStatus === EthTxStatus.Submit) return dfstyles.colors.dfgreen;
    else if (txStatus === EthTxStatus.Confirm) return undefined;
    else if (txStatus === EthTxStatus.Fail) return dfstyles.colors.dfred;
  }
  return undefined;
};

class NotificationManager extends EventEmitter {
  static instance: NotificationManager;

  private constructor() {
    super();
  }

  static getInstance(): NotificationManager {
    if (!NotificationManager.instance) {
      NotificationManager.instance = new NotificationManager();
    }

    return NotificationManager.instance;
  }

  private getIcon(type: NotificationType) {
    if (type === NotificationType.Tx) return <EthIcon />;
    else return <span>!</span>;
  }

  notify(type: NotificationType, message: React.ReactNode): void {
    this.emit(NotificationManagerEvent.Notify, {
      type,
      message,
      id: getRandomActionId(),
      icon: this.getIcon(type),
      color: getNotifColor(type),
    });
  }

  notifyTx(
    txData: UnconfirmedTx,
    message: React.ReactNode,
    txStatus: EthTxStatus
  ): void {
    this.emit(NotificationManagerEvent.Notify, {
      type: NotificationType.Tx,
      message,
      id: txData.actionId,
      icon: this.getIcon(NotificationType.Tx),
      color: getNotifColor(NotificationType.Tx, txStatus),
      txData,
      txStatus,
    });
  }

  txInit(tx: UnconfirmedTx): void {
    this.notifyTx(
      tx,
      <span>Transaction {tx.actionId} initialized.</span>,
      EthTxStatus.Init
    );
  }

  txSubmit(tx: SubmittedTx): void {
    this.notifyTx(
      tx,
      <span>
        Transaction {tx.actionId} accepted by Ethereum.
        <br />
        <TxLink tx={tx} />
      </span>,
      EthTxStatus.Submit
    );
  }

  txConfirm(tx: SubmittedTx): void {
    this.notifyTx(
      tx,
      <span>
        Transaction {tx.actionId} confirmed.
        <br />
        Hash: <TxLink tx={tx} />
      </span>,
      EthTxStatus.Confirm
    );
  }

  unsubmittedTxFail(tx: UnconfirmedTx, e: Error): void {
    this.notifyTx(
      tx,
      <span>
        Transaction {tx.actionId} failed.
        <br />
        Reason: {e.message}
      </span>,
      EthTxStatus.Fail
    );
  }

  txRevert(tx: SubmittedTx): void {
    this.notifyTx(
      tx,
      <span>
        Transaction {tx.txHash.slice(0, 8)} reverted.
        <br />
        <TxLink tx={tx} />
      </span>,
      EthTxStatus.Fail
    );
  }

  welcomePlayer(): void {
    this.notify(
      NotificationType.WelcomePlayer,
      <span>
        Welcome to the world to Dark Forest! These are your notifications.
        <br />
        Click a notification to dismiss it.
      </span>
    );
  }

  foundSpace(chunk: ExploredChunkData): void {
    this.notify(
      NotificationType.FoundSpace,
      <span>
        Congrats! You found space! Space has more valuable resources than <br />
        the nebula where your home planet is located.{' '}
        <CenterChunkLink chunk={chunk}>Click to view</CenterChunkLink>.
      </span>
    );
  }

  foundDeepSpace(chunk: ExploredChunkData): void {
    this.notify(
      NotificationType.FoundDeepSpace,
      <span>
        Congrats! You found deep space! Deep space has the rarest <br />
        planets, but planets all have lowered defense!{' '}
        <CenterChunkLink chunk={chunk}>Click to view</CenterChunkLink>.
      </span>
    );
  }

  foundSilver(planet: Planet): void {
    this.notify(
      NotificationType.FoundSilver,
      <span>
        You found a silver mine! Silver can be used to upgrade planets. <br />
        Click to view <PlanetNameLink planet={planet} />.
      </span>
    );
  }

  foundPirates(planet: Planet): void {
    this.notify(
      NotificationType.FoundPirates,
      <span>
        You found space pirates! Unconquered planets must be defeated first.
        <br />
        Click to view <PlanetNameLink planet={planet} />.
      </span>
    );
  }

  foundComet(planet: Planet): void {
    this.notify(
      NotificationType.FoundComet,
      <span>
        You found a comet! Planets with comets have a stat doubled! <br />
        Click to view <PlanetNameLink planet={planet} />
      </span>
    );
  }

  planetCanUpgrade(planet: Planet): void {
    if (planetCanUpgrade(planet)) {
      this.notify(
        NotificationType.CanUpgrade,
        <span>
          Your planet <PlanetNameLink planet={planet} /> can upgrade! <br />
        </span>
      );
    }
  }

  balanceEmpty(): void {
    this.notify(
      NotificationType.BalanceEmpty,
      <span>
        Your xDAI account is out of balance!
        <br />
        Click <FAQ04Link>here</FAQ04Link> to learn how to get more.
      </span>
    );
  }
}

export default NotificationManager;
