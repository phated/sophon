import React, { useContext, useState, useEffect } from 'react';
import styled from 'styled-components';
import { ModalPane, ModalHook, ModalName } from './ModalPane';
import GameUIManager from '../board/GameUIManager';
import GameUIManagerContext from '../board/GameUIManagerContext';
import { EthAddress, Planet, Player } from '../../_types/global/GlobalTypes';
import { Sub } from '../../components/Text';
import dfstyles from '../../styles/dfstyles.bs.js';
import { PlanetThumb, PlanetLink } from './PlanetDexPane';
import { getPlayerShortHash } from '../../utils/Utils';
import { BLOCK_EXPLORER_URL } from '../../utils/constants';

const LeaderboardWrapper = styled.div`
  width: 42em;
  min-height: 15em;
  max-height: 24em;
  overflow-y: scroll;

  & > div {
    width: 100%;
    display: flex;
    flex-direction: row;
    justify-content: space-between;

    height: 30px;

    & > span {
      margin-left: 0.25em;
      display: flex;
      flex-direction: row;
      align-items: center;
      &:last-child {
        margin-left: 0;
      }
      // rank
      &:nth-child(1) {
        width: 3em;
      }
      &:nth-child(2) {
        margin-right: 1em;
      }
      // playername
      &:nth-child(3) {
        flex-grow: 1;
      }
      // planet icons
      &:nth-child(4) {
        width: 10em;

        display: flex;
        flex-direction: row;
        justify-content: space-between;
      }
      &:nth-child(5) {
        width: 4em;
        margin-left: 1em;
      }
    }

    // lmao make this shit a class
    &:not(:first-child) > span:nth-child(4) > span {
      width: 3em;
      cursor: pointer;
      transition: filter 0.2s;
      &:hover {
        filter: brightness(80%);
      }
    }
  }

  & a {
    &:hover {
      text-decoration: underline;
      cursor: pointer;
      color: ${dfstyles.colors.subtext};
    }
  }
`;

type ScoreboardEntry = {
  playerId: EthAddress;
  twitter?: string;
  score: number;
  sortedPlanets: Planet[];
};

function calculateScoreboard(
  players: Player[],
  planets: Planet[]
): ScoreboardEntry[] {
  const scoreboardMap: Record<EthAddress, ScoreboardEntry> = [];
  for (const player of players) {
    scoreboardMap[player.address] = {
      playerId: player.address,
      score: 0,
      sortedPlanets: [],
    };
    if (player.twitter) {
      scoreboardMap[player.address].twitter = player.twitter;
    }
  }
  for (const planet of planets) {
    const owner = planet.owner;
    if (scoreboardMap[owner]) {
      scoreboardMap[owner].sortedPlanets.push(planet);
    }
  }
  for (const player of players) {
    const entry: ScoreboardEntry = scoreboardMap[player.address];
    entry.sortedPlanets.sort((a, b) => b.energyCap - a.energyCap);
    const nPlanets = entry.sortedPlanets.length;
    for (let i = 0; i < nPlanets; i += 1) {
      const planet = entry.sortedPlanets[i];
      entry.score += (planet.silverSpent + planet.silver) / 10; // silver spent or held on this planet
      if (i < 10) {
        entry.score += planet.energyCap;
      }
    }
  }
  const entries: ScoreboardEntry[] = Object.values(scoreboardMap);
  entries.sort((a, b) => b.score - a.score);

  return entries;
}

// as [rank, score]
export function calculateRankAndScore(
  players: Player[],
  planets: Planet[],
  account: EthAddress
): [number, number] {
  const entries = calculateScoreboard(players, planets);
  for (let i = 0; i < entries.length; i++) {
    if (entries[i].playerId === account) {
      return [i + 1, entries[i].score];
    }
  }

  return [-1, -1];
}

export function LeaderboardPane({ hook }: { hook: ModalHook }): JSX.Element {
  const uiManager = useContext<GameUIManager | null>(GameUIManagerContext);
  const [scoreboard, setScoreboard] = useState<ScoreboardEntry[]>([]);

  const [account, setAccount] = useState<EthAddress | null>(null);
  useEffect(() => {
    if (!uiManager) return;
    setAccount(uiManager.getAccount());
  }, [uiManager]);

  const [visible] = hook;

  useEffect(() => {
    if (uiManager) {
      const players = uiManager.getAllPlayers();
      const planets = uiManager.getAllOwnedPlanets();
      const entries = calculateScoreboard(players, planets);

      setScoreboard(entries);
    }
  }, [uiManager, visible, account]);

  return (
    <ModalPane hook={hook} title='Leaderboard' name={ModalName.Leaderboard}>
      <LeaderboardWrapper>
        <div>
          <span></span>
          <span>
            <Sub>
              <u>Player</u>
            </Sub>
          </span>
          <span>
            <Sub>
              <u>Twitter?</u>
            </Sub>
          </span>
          <span>
            <Sub>
              <u>Top Planets</u>
            </Sub>
          </span>
          <span>
            <Sub>
              <u>Score</u>
            </Sub>
          </span>
        </div>
        {scoreboard.map((entry, idx) => (
          <div
            key={idx}
            style={{
              background:
                entry.playerId === account
                  ? dfstyles.colors.backgroundlight
                  : undefined,
            }}
          >
            <span>
              <Sub>#{idx + 1}</Sub>
            </span>

            <span>
              <a onClick={() => window.open(`${BLOCK_EXPLORER_URL}/address/${entry.playerId}`)}>
                {getPlayerShortHash(entry.playerId)}
              </a>
            </span>
            <span>
              {entry.twitter &&
                <a onClick={() => window.open(`http://twitter.com/${entry.twitter}`)}>
                  @{entry.twitter}
                </a>
              }
            </span>
            <span>
              {entry.sortedPlanets.slice(0, 3).map((planet, i) => (
                <span key={i}>
                  <PlanetLink planet={planet}>
                    <PlanetThumb planet={planet} />
                  </PlanetLink>
                </span>
              ))}
            </span>
            <span>{Math.floor(entry.score)}</span>
          </div>
        ))}
      </LeaderboardWrapper>
    </ModalPane>
  );
}
