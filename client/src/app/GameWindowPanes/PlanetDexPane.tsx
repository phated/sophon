import React, { useContext, useEffect, useState } from 'react';
import styled from 'styled-components';
import {
  ModalPane,
  ModalHook,
  ModalName,
  IconButton,
} from './ModalPane';
import GameUIManager from '../board/GameUIManager';
import GameUIManagerContext from '../board/GameUIManagerContext';
import { Planet, PlanetResource, UpgradeBranchName } from '../../_types/global/GlobalTypes';
import UIEmitter, { UIEmitterEvent } from '../../utils/UIEmitter';
import { Sub, Space } from '../../components/Text';
import {
  getPlanetShortHash,
  formatNumber,
  getPlanetRank,
  planetCanUpgrade,
} from '../../utils/Utils';
import dfstyles from '../../styles/dfstyles.bs.js';
import { getPlanetName, getPlanetCosmetic } from '../../utils/ProcgenUtils';
import { SelectedContext, AccountContext } from '../GameWindow';
import { SilverIcon, RankIcon } from '../Icons';
import { calculateRankAndScore } from './LeaderboardPane';
import { DefenseIcon, RangeIcon, SpeedIcon } from '../Icons';

async function distributeAllAsteroids(asteroids) {
  for (const asteroid of asteroids) {
    // Keep 35% of max energy on the planet, so we work backwards to the percent to send
    const percent = (1 - (asteroid.energyCap * 0.35 / asteroid.energy)) * 100;
    await uiManager.distributeSilver(asteroid.locationId, percent);
  }
}

const DexWrapper = styled.div`
  height: 12.2em; // exact size so a row is cut off
  overflow-y: scroll;
`;

const DexRow = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;

  height: 30px; // 5 + 3 * 7 + 4px

  & > span {
    // planet ranking
    &:nth-child(1) {
      width: 2em;
    }
    &:nth-child(2) {
      display: flex;
      flex-direction: row;
      justify-content: space-around;
      align-items: center;
      width: 3em;
      position: relative; // for planetcircle
    }
    // planet owner
    &:nth-child(3) {
      // short hash
      margin-right: 0.5em;
    }
    // planet name
    &:nth-child(4) {
      flex-grow: 1;
    }
    // planet level
    &:nth-child(5) {
      width: 3em;
      text-align: center;
    }
    // planet rank
    &:nth-child(6) {
      width: 3em;
      text-align: center;
    }
    // energy
    &:nth-child(7) {
      width: 6.5em;
    }
    // silver
    &:nth-child(8) {
      width: 6.5em;
    }
    // score
    // &:nth-child(9) {
    //   width: 7em;
    // }
  }

  &.title-row > span {
    color: ${dfstyles.colors.subtext};

    &.selected {
      text-decoration: underline;
      color: ${dfstyles.colors.text};
    }

    &:hover {
      text-decoration: underline;
      cursor: pointer;
    }

    &.selected {
      text-decoration: underline;
    }

    &:nth-child(1),
    &:nth-child(2) {
      text-decoration: none;
      pointer-events: none;
      &:hover {
        text-decoration: none;
      }
    }
  }

  &:hover:not(.title-row) {
    cursor: pointer;
    & > span:nth-child(3) {
      text-decoration: underline;
    }
  }

  &.selected {
    background: ${dfstyles.colors.backgroundlight};
    & > span:nth-child(2) span:last-child {
      text-decoration: underline;
    }
  }
`;
const _PlanetThumb = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
  & > span {
    // these guys wrap the icons
    position: absolute;
    width: 100%;
    height: 100%;

    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-around;
  }
`;

const ColorIcon = styled.span<{ color: string }>`
  path {
    fill: ${({ color }) => color} !important;
  }
`;

const Button = styled.div<{ active: boolean }>`
  min-width: 72.5px;
  border-radius: 2px;
  border: 1px solid ${dfstyles.colors.subtext};
  padding: 0.2em;

  text-align: center;

  &:hover {
    cursor: pointer;
    border: 1px solid ${dfstyles.colors.text};
  }

  background: ${({ active }) => (active ? dfstyles.colors.text : 'none')};

  &,
  & span {
    ${({ active }) =>
    active && `color: ${dfstyles.colors.background} !important`};
  }

  & p > span {
    vertical-align: middle;
  }

  &.disabled {
    border: 1px solid ${dfstyles.colors.subtext} !important;
    &,
    & span {
      color: ${dfstyles.colors.subtext} !important;
      cursor: auto !important;
    }
  }
`;

export function PlanetThumb({ planet }: { planet: Planet }): JSX.Element {
  const radius = 5 + 3 * planet.planetLevel;
  // const radius = 5 + 3 * PlanetLevel.MAX;
  const { baseColor, backgroundColor } = getPlanetCosmetic(planet);

  const ringW = radius * 1.5;
  const ringH = Math.max(2, ringW / 7);

  if (planet.planetResource === PlanetResource.SILVER) {
    return (
      <_PlanetThumb>
        <ColorIcon color={baseColor}>
          <SilverIcon />
        </ColorIcon>
      </_PlanetThumb>
    );
  }

  return (
    <_PlanetThumb>
      <span>
        <span
          style={{
            width: radius + 'px',
            height: radius + 'px',
            borderRadius: radius / 2 + 'px',
            background: baseColor,
          }}
        ></span>
      </span>
      <span>
        <span
          style={{
            width: ringW + 'px',
            height: ringH + 'px',
            borderRadius: ringW * 2 + 'px',
            background: getPlanetRank(planet) > 0 ? backgroundColor : 'none',
          }}
        ></span>
      </span>
    </_PlanetThumb>
  );
}

const getPlanetScore = (planet: Planet, rank: number) => {
  const baseScore = rank < 10 ? planet.energyCap : 0;
  const totalSilver = planet.silverSpent + planet.silver;
  return baseScore + totalSilver / 10;
};

const PlayerInfoWrapper = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;

  height: 30px; // 5 + 3 * 7 + 4px

  & > div > span:last-of-type {
    margin-left: 0.5em;
  }
`;

const ButtonRow = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;

  height: 30px; // 5 + 3 * 7 + 4px

  > div {
    margin-right: 0.5em;
  }
`;

const PlayerInfoRow = () => {
  const account = useContext<EthAddress | null>(AccountContext);
  const uiManager = useContext<GameUIManager | null>(GameUIManagerContext);
  const players = uiManager.getAllPlayers();
  const planets = uiManager.getAllOwnedPlanets();
  const [rank, score] = calculateRankAndScore(
    players,
    planets,
    account
  );

  return (
    <>
      <div>
        <span>Total Energy</span>
        <Sub>:</Sub>
        <span>
          {account && uiManager
            ? formatNumber(uiManager.getEnergyOfPlayer(account))
            : '...'}
        </span>
      </div>
      <div>
        <span>Total Silver</span>
        <Sub>:</Sub>
        <span>
          {account && uiManager
            ? formatNumber(uiManager.getSilverOfPlayer(account))
            : '...'}
        </span>
      </div>
      <div>
        <span>Score</span>
        <Sub>:</Sub>
        <span>{Math.floor(score)}</span>
      </div>
      <div>
        <span>Rank</span>
        <Sub>:</Sub>
        <span>{rank}</span>
      </div>
    </>
  );
};

function DexEntry({
  planet,
  className,
  score: _score,
  rank,
}: {
  planet: Planet;
  className: string;
  score: number;
  rank: number,
}) {
  const energyStyle = planet.energy === planet.energyCap ? { color: 'red' } : {};
  const silverStyle = planet.silver === planet.silverCap ? { color: 'red' } : {};
  return (
    <PlanetLink planet={planet}>
      <DexRow className={className}>
        <span>
          {rank}.
        </span>
        <span>
          <PlanetThumb planet={planet} />
        </span>
        <span>
          <Sub>{getPlanetShortHash(planet)}</Sub>
        </span>
        <span>
          <span>{getPlanetName(planet)}</span>
        </span>
        <span>
          <Sub>lv</Sub> {planet.planetLevel}
        </span>
        <span><RankIcon planet={planet} /></span>
        <span style={energyStyle}>
          {formatNumber(planet.energy)}<Sub>/</Sub>{formatNumber(planet.energyCap)}
        </span>
        <span style={silverStyle}>
          {formatNumber(planet.silver)}<Sub>/</Sub>{formatNumber(planet.silverCap)}
        </span>
        {/* <span>
          {formatNumber(score)}
          <Sub> pts</Sub>
        </span> */}
      </DexRow>
    </PlanetLink>
  );
}

export function PlanetLink({
  planet,
  children,
}: {
  planet: Planet;
  children: React.ReactNode;
}): JSX.Element {
  const uiManager = useContext<GameUIManager | null>(GameUIManagerContext);
  const uiEmitter = UIEmitter.getInstance();

  return (
    <span
      onClick={() => {
        uiManager?.setSelectedPlanet(planet);
        uiEmitter.emit(UIEmitterEvent.CenterPlanet, planet);
      }}
    >
      {children}
    </span>
  );
}

enum Columns {
  Name = 0,
  Level = 1,
  Energy = 2,
  Silver = 3,
  Points = 4,
}

export function PlanetDexPane({ hook }: { hook: ModalHook; }): JSX.Element {
  const [visible] = hook;
  const uiManager = useContext<GameUIManager | null>(GameUIManagerContext);
  const selected = useContext<Planet | null>(SelectedContext);

  const [sortBy, setSortBy] = useState<Columns>(Columns.Points);

  const scoreFn = (a: [Planet, number], b: [Planet, number]): number => {
    const [scoreA, scoreB] = [getPlanetScore(...a), getPlanetScore(...b)];
    return scoreB - scoreA;
  };

  const nameFn = (a: [Planet, number], b: [Planet, number]): number => {
    const [nameA, nameB] = [getPlanetName(a[0]), getPlanetName(b[0])];
    return nameA.localeCompare(nameB);
  };

  const energyFn = (a: [Planet, number], b: [Planet, number]): number => {
    return b[0].energy - a[0].energy;
  };

  const silverFn = (a: [Planet, number], b: [Planet, number]): number => {
    return b[0].silver - a[0].silver;
  };

  const levelFn = (a: [Planet, number], b: [Planet, number]): number => {
    return b[0].planetLevel - a[0].planetLevel;
  };

  const sortingFn = (a: [Planet, number], b: [Planet, number]): number => {
    const [scoreA, scoreB] = [getPlanetScore(...a), getPlanetScore(...b)];
    const myFn = [nameFn, levelFn, energyFn, silverFn, scoreFn][sortBy];
    if (scoreA !== scoreB) return myFn(a, b);

    if (!uiManager) return 0;
    const locA = uiManager.getLocationOfPlanet(a[0].locationId);
    const locB = uiManager.getLocationOfPlanet(a[0].locationId);
    if (!locA || !locB) return 0;
    const { x: xA, y: yA } = locA.coords;
    const { x: xB, y: yB } = locB.coords;

    if (xA !== xB) return xA - xB;
    return yA - yB;
  };

  const [planets, setPlanets] = useState<Planet[]>([]);

  // update planet list on open
  useEffect(() => {
    if (!visible) return;
    if (!uiManager) return;
    const myAddr = uiManager.getAccount();
    if (!myAddr) return;
    const ownedPlanets = uiManager
      .getAllOwnedPlanets()
      .filter((planet) => planet.owner === myAddr);
    setPlanets(ownedPlanets);
  }, [visible, uiManager]);

  const getUpgradeSilverNeeded = (planet) => {
    if (!planet) return 0;
    const totalLevel = planet.upgradeState.reduce((a, b) => a + b);
    const totalNeeded = Math.floor((totalLevel + 1) * 0.2 * planet.silverCap);
    return totalNeeded;
  };

  const [autoUpgradeBranch, setAutoUpgradeBranch] = useState(null);

  useEffect(() => {
    if (!uiManager || autoUpgradeBranch == null) return;

    planets
      .filter(planet => {
        if (
          planetCanUpgrade(planet) &&
          planet.silver >= getUpgradeSilverNeeded(planet) &&
          planet.unconfirmedUpgrades?.length === 0
        ) {
          // 4 is the max level an upgrade can be
          if (planet.upgradeState[autoUpgradeBranch] < 4) {
            return true;
          } else {
            console.log(`AutoUpgrade: Can't upgrade past level 4, try a different stat`);
            return false;
          }
        }
        return false
      })
      .forEach(planet => uiManager.upgrade(planet, autoUpgradeBranch));

    setAutoUpgradeBranch(null);
  }, [autoUpgradeBranch, planets, uiManager])

  const [autoDistributeAsteroids, setAutoDistributeAsteroids] = useState(false);
  useEffect(() => {
    if (!uiManager || !autoDistributeAsteroids) return;

    const asteroids = planets
      .filter((planet) => planet.planetResource === PlanetResource.SILVER);

    distributeAllAsteroids(asteroids)
      .then(() => {
        console.log('Successfully distributed all asteroids')
        setAutoDistributeAsteroids(false);
      })
      .catch((err) => {
        console.error('Encountered an error while distributing all asteroids', err);
        setAutoDistributeAsteroids(false);
      });
  }, [autoDistributeAsteroids, planets, uiManager]);

  return (
    <ModalPane hook={hook} title='Planet Dex' name={ModalName.PlanetDex}>
      {visible ? <PlayerInfoWrapper>
        <PlayerInfoRow />
      </PlayerInfoWrapper> : null}
      <ButtonRow>
        <div>Upgrade All</div>
        <IconButton onClick={() => setAutoUpgradeBranch(UpgradeBranchName.Defense)}>
          <DefenseIcon />
        </IconButton>
        <IconButton onClick={() => setAutoUpgradeBranch(UpgradeBranchName.Range)}>
          <RangeIcon />
        </IconButton>
        <IconButton onClick={() => setAutoUpgradeBranch(UpgradeBranchName.Speed)}>
          <SpeedIcon />
        </IconButton>
        <Button active={autoDistributeAsteroids} onClick={() => setAutoDistributeAsteroids(true)}>
          Auto Distribute Asteroids
        </Button>
      </ButtonRow>
      <DexWrapper>
        <DexRow className='title-row'>
          <span
            className={sortBy === Columns.Points ? 'selected' : ''}
            onClick={() => setSortBy(Columns.Points)}
          >#</span>
          <span></span> {/* empty icon cell */}
          <span>
            <Space length={5} />
          </span>{' '}
          {/* empty icon cell */}
          <span
            className={sortBy === Columns.Name ? 'selected' : ''}
            onClick={() => setSortBy(Columns.Name)}
          >
            Planet Name
          </span>
          <span
            className={sortBy === Columns.Level ? 'selected' : ''}
            onClick={() => setSortBy(Columns.Level)}
          >
            Level
          </span>
          <span>
            Rank
          </span>
          <span
            className={sortBy === Columns.Energy ? 'selected' : ''}
            onClick={() => setSortBy(Columns.Energy)}
          >
            Energy
          </span>
          <span
            className={sortBy === Columns.Silver ? 'selected' : ''}
            onClick={() => setSortBy(Columns.Silver)}
          >
            Silver
          </span>
          {/* <span
            className={sortBy === Columns.Points ? 'selected' : ''}
            onClick={() => setSortBy(Columns.Points)}
          >
            Points
          </span> */}
        </DexRow>
        {visible && planets
          .sort((a, b) => b.energyCap - a.energyCap)
          .map((planet, i) => [planet, i]) // pass the index
          .sort(sortingFn) // sort using planet + index
          .map(([planet, i]: [Planet, number], rank) => (
            <DexEntry
              key={i}
              planet={planet}
              // score={getPlanetScore(planet, i)}
              rank={rank + 1}
              className={
                selected?.locationId === planet.locationId ? 'selected' : ''
              }
            />
          ))}
      </DexWrapper>
    </ModalPane>
  );
}
