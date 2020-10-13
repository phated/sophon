import React, { useContext, useEffect, useState } from 'react';
import styled from 'styled-components';
import {
  ModalPane,
  ModalHook,
  ModalName,
} from './ModalPane';
import GameUIManager from '../board/GameUIManager';
import GameUIManagerContext from '../board/GameUIManagerContext';
import { Planet, PlanetResource } from '../../_types/global/GlobalTypes';
import UIEmitter, { UIEmitterEvent } from '../../utils/UIEmitter';
import { Sub, Space } from '../../components/Text';
import {
  getPlayerShortHash,
  getPlanetShortHash,
  formatNumber,
  getPlanetRank,
  bonusFromHex
} from '../../utils/Utils';
import dfstyles from '../../styles/dfstyles.bs.js';
import { getPlanetName, getPlanetCosmetic } from '../../utils/ProcgenUtils';
import { SelectedContext } from '../GameWindow';
import { SilverIcon, RankIcon } from '../Icons';
import {
  emptyAddress,
} from '../../utils/CheckedTypeUtils';

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
    // planet icon
    &:nth-child(1) {
      display: flex;
      flex-direction: row;
      justify-content: space-around;
      align-items: center;
      width: 3em;
      position: relative; // for planetcircle
    }
    // short hash
    &:nth-child(2) {
      margin-right: 0.5em;
    }
    // player owner
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
    // rank
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

function DexEntry({ planet, className }: { planet: Planet; className: string; }) {
  const energyStyle = planet.energy === planet.energyCap ? { color: 'red' } : {};
  const silverStyle = planet.silver === planet.silverCap ? { color: 'red' } : {};

  return (
    <PlanetLink planet={planet}>
      <DexRow className={className}>
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

export function EnergyDexPane({ hook }: { hook: ModalHook; }): JSX.Element {
  const [visible] = hook;
  const uiManager = useContext<GameUIManager | null>(GameUIManagerContext);
  const selected = useContext<Planet | null>(SelectedContext);

  const createTable = (planets: [Planet]) => {
    const dexes = [];

    function levelSort(a, b) {
      return b.planetLevel - a.planetLevel;
    }

    for (const [i, planet] of planets.sort(levelSort).entries()) {

      let owner = '      ';
      if (planet.owner !== emptyAddress) {
        owner = getPlayerShortHash(planet.owner);
      };

      dexes.push(<DexEntry
        key={i}
        owner={owner}
        planet={planet}
        className={
          selected?.locationId === planet.locationId ? 'selected' : ''
        }
      />);
    }
    return dexes.slice(0, 50);
  }


  const [planets, setPlanets] = useState<Planet[]>([]);

  // update planet list on open
  useEffect(() => {
    if (!visible) return;
    if (!uiManager) return;
    const myAddr = uiManager.getAccount();
    if (!myAddr) return;

    const energy = [];

    for (const planet of uiManager.getAllPlanets().values()) {
      const [
        energyCapBonus,
        // energyGroBonus,
        // rangeBonus,
        // speedBonus,
        // defBonus,
      ] = bonusFromHex(planet.locationId);
      if (energyCapBonus) {
        energy.push(planet);
      }
    }
    setPlanets(energy);
  }, [visible, uiManager]);

  return (
    <ModalPane hook={hook} title='Energy Bonus Dex' name={ModalName.EnergyDex}>
      <DexWrapper>
        <DexRow className='title-row'>
          <span></span> {/* empty icon cell */}
          <span>
            <Space length={5} />
          </span>{' '}
          <span>
            Owner
          </span>
          <span>
            Planet Name
          </span>
          <span>
            Level
          </span>
          <span>
            Rank
          </span>
          <span>
            Energy
          </span>
          <span>
            Silver
          </span>
        </DexRow>
        {visible && createTable(planets)}
      </DexWrapper>
    </ModalPane>
  );
}
