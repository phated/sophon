import { BigNumber as EthersBN } from 'ethers';
import { LocationId, Upgrade } from '../../global/GlobalTypes';

// TODO write these types
export type ContractCallArgs = Array<unknown>;

export enum ZKArgIdx {
  PROOF_A,
  PROOF_B,
  PROOF_C,
  DATA,
}

export enum InitArgIdxs {
  LOCATION_ID,
  PERLIN,
  RADIUS,
}

export enum MoveArgIdxs {
  FROM_ID,
  TO_ID,
  TO_PERLIN,
  TO_RADIUS,
  DIST_MAX,
  SHIPS_SENT,
  SILVER_SENT,
}

export enum UpgradeArgIdxs {
  LOCATION_ID,
  UPGRADE_BRANCH,
}

export enum ContractEvent {
  PlayerInitialized = 'PlayerInitialized',
  ArrivalQueued = 'ArrivalQueued',
  PlanetUpgraded = 'PlanetUpgraded',
  BoughtHat = 'BoughtHat',
}

export enum ContractsAPIEvent {
  PlayerInit = 'PlayerInit',
  PlanetUpdate = 'PlanetUpdate',
  TxInitialized = 'TxInitialized',
  TxInitFailed = 'TxInitFailed',
  TxSubmitted = 'TxSubmitted',
  TxConfirmed = 'TxConfirmed',
  RadiusUpdated = 'RadiusUpdated',
}

export type InitializePlayerArgs = [
  [string, string], // proofA
  [
    // proofB
    [string, string],
    [string, string]
  ],
  [string, string], // proofC
  [string, string, string] // locationId (BigInt), perlin, radius
];

// planet locationID(BigInt), branch number
export type UpgradeArgs = [string, string];

export type MoveSnarkArgs = [
  [string, string], // proofA
  [
    // proofB
    [string, string],
    [string, string]
  ],
  [string, string], // proofC
  [
    string, // from locationID (BigInt)
    string, // to locationID (BigInt)
    string, // perlin at to
    string, // radius at to
    string // distMax
  ]
];

export type MoveArgs = [
  [string, string], // proofA
  [
    // proofB
    [string, string],
    [string, string]
  ],
  [string, string], // proofC
  [
    string, // from locationID (BigInt)
    string, // to locationID (BigInt)
    string, // perlin at to
    string, // radius at to
    string, // distMax
    string, // ships sent
    string // silver sent
  ]
];

export type UpgradeBranch = [Upgrade, Upgrade, Upgrade, Upgrade];
export type UpgradesInfo = [UpgradeBranch, UpgradeBranch, UpgradeBranch];

export interface ContractConstants {
  TIME_FACTOR_HUNDREDTHS: number;
  PERLIN_THRESHOLD_1: number;
  PERLIN_THRESHOLD_2: number;
  PLANET_RARITY: number;

  SILVER_RARITY_1: number;
  SILVER_RARITY_2: number;
  SILVER_RARITY_3: number;

  defaultPopulationCap: number[];
  defaultPopulationGrowth: number[];

  defaultSilverCap: number[];
  defaultSilverGrowth: number[];

  defaultRange: number[];
  defaultSpeed: number[];
  defaultDefense: number[];
  defaultBarbarianPercentage: number[];

  planetLevelThresholds: number[];
  planetCumulativeRarities: number[];

  upgrades: UpgradesInfo;
}

export type ClientMockchainData =
  | null
  | undefined
  | number
  | string
  | boolean
  | EthersBN
  | ClientMockchainData[]
  | {
      [key in string | number]: ClientMockchainData;
    };

/*
export interface RawArrivalData {
  // note that from actual blockchain, this will be an array
  // not an object; this fields will be keyed by numerica index, not string
  arrivalId: string;
  departureTime: BigNumber;
  arrivalTime: BigNumber;
  player: string;
  oldLoc: BigNumber;
  newLoc: BigNumber;
  maxDist: BigNumber;
  shipsMoved: BigNumber;
  silverMoved: BigNumber;
}
*/
/*
export type RawQueuedArrival = {
  eventId: string;
  player: string;
  fromPlanet: BigNumber;
  toPlanet: BigNumber;
  popArriving: BigNumber;
  silverMoved: BigNumber;

  timeTrigger: BigNumber;
  timeAdded: BigNumber;
}
*/
export enum PlanetEventType {
  ARRIVAL,
}

export type RawPlanetEventMetadata = {
  id: string;
  eventType: EthersBN;
  timeTrigger: EthersBN;
  timeAdded: EthersBN;
};

export type RawUpgrade = {
  0: EthersBN;
  popCapMultiplier?: EthersBN;

  1: EthersBN;
  popGroMultiplier?: EthersBN;

  2: EthersBN;
  rangeMultiplier?: EthersBN;

  3: EthersBN;
  speedMultiplier?: EthersBN;

  4: EthersBN;
  defMultiplier?: EthersBN;
};

export type RawUpgradesInfo = [
  [RawUpgrade, RawUpgrade, RawUpgrade, RawUpgrade],
  [RawUpgrade, RawUpgrade, RawUpgrade, RawUpgrade],
  [RawUpgrade, RawUpgrade, RawUpgrade, RawUpgrade]
];

export type RawArrivalData = {
  0: EthersBN;
  id?: EthersBN;

  1: string;
  player?: string;

  2: EthersBN;
  fromPlanet?: EthersBN;

  3: EthersBN;
  toPlanet?: EthersBN;

  4: EthersBN;
  popArriving?: EthersBN;

  5: EthersBN;
  silverMoved?: EthersBN;

  6: EthersBN;
  departureTime?: EthersBN;

  7: EthersBN;
  arrivalTime?: EthersBN;
};

export type RawDefaults = {
  0: string;
  label?: string;

  1: EthersBN;
  populationCap?: EthersBN;

  2: EthersBN;
  populationGrowth?: EthersBN;

  3: EthersBN;
  range?: EthersBN;

  4: EthersBN;
  speed?: EthersBN;

  5: EthersBN;
  defense?: EthersBN;

  6: EthersBN;
  silverGrowth?: EthersBN;

  7: EthersBN;
  silverCap?: EthersBN;

  8: EthersBN;
  barbarianPercentage?: EthersBN;
}[];

export interface RawPlanetData {
  // note that from actual blockchain, this will be an array
  // not an object; this fields will be keyed by numerical index, not string
  0: string;
  owner?: string;

  1: EthersBN;
  range?: EthersBN;

  2: EthersBN;
  speed?: EthersBN;

  3: EthersBN;
  defense?: EthersBN;

  4: EthersBN;
  population?: EthersBN;

  5: EthersBN;
  populationCap?: EthersBN;

  6: EthersBN;
  populationGrowth?: EthersBN;

  7: number;
  planetResource?: number;

  8: EthersBN;
  silverCap?: EthersBN;

  9: EthersBN;
  silverGrowth?: EthersBN;

  10: EthersBN;
  silver?: EthersBN;

  11: EthersBN;
  planetLevel?: EthersBN;
}

export interface RawPlanetExtendedInfo {
  // note that from actual blockchain, this will be an array
  // not an object; this fields will be keyed by numerical index, not string
  0: boolean;
  isInitialized?: boolean;

  1: EthersBN;
  createdAt?: EthersBN;

  2: EthersBN;
  lastUpdated?: EthersBN;

  3: EthersBN;
  perlin?: EthersBN;

  4: number;
  spaceType?: number;

  5: EthersBN;
  upgradeState0?: EthersBN;

  6: EthersBN;
  upgradeState1?: EthersBN;

  7: EthersBN;
  upgradeState2?: EthersBN;

  8: EthersBN;
  hatLevel?: EthersBN;

  // 9 is delegatedPlayers, but we don't get this array
}

export enum EthTxType {
  INIT = 'INIT',
  MOVE = 'MOVE',
  UPGRADE = 'UPGRADE',
  BUY_HAT = 'BUY_HAT',
}

export enum EthTxStatus {
  Init,
  Submit,
  Confirm,
  Fail,
}

export type UnconfirmedTx = {
  // we generate a txId so we can reference the tx
  // before it is submitted to chain and given a txHash
  actionId: string;
  type: EthTxType;
};

export type SubmittedTx = UnconfirmedTx & {
  txHash: string;
  sentAtTimestamp: number;
};

export type UnconfirmedInit = UnconfirmedTx & {
  type: EthTxType.INIT;
  locationId: LocationId;
};

export type SubmittedInit = UnconfirmedInit & SubmittedTx;

export type UnconfirmedMove = UnconfirmedTx & {
  type: EthTxType.MOVE;
  from: LocationId;
  to: LocationId;
  forces: number;
  silver: number;
};

export type SubmittedMove = UnconfirmedMove & SubmittedTx;

export type UnconfirmedUpgrade = UnconfirmedTx & {
  type: EthTxType.UPGRADE;
  locationId: LocationId;
  upgradeBranch: number; // 0, 1, or 2
};

export type SubmittedUpgrade = UnconfirmedUpgrade & SubmittedTx;

export type UnconfirmedBuyHat = UnconfirmedTx & {
  type: EthTxType.BUY_HAT;
  locationId: LocationId;
};

export type SubmittedBuyHat = UnconfirmedBuyHat & SubmittedTx;
