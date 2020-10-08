import React, { useContext, useState, useEffect } from 'react';
import { TooltipName } from '../../utils/WindowManager';
import {
  Planet,
  PlanetResource,
  EthAddress,
} from '../../_types/global/GlobalTypes';
import styled from 'styled-components';
import { Sub, Red, White, Green } from '../../components/Text';
import { getPlanetRank, isFullRank } from '../../utils/Utils';
import GameUIManager from '../board/GameUIManager';
import GameUIManagerContext from '../board/GameUIManagerContext';
import { SelectedContext } from '../GameWindow';

const TooltipInfo = styled.div`
  & > div {
    display: flex;
    flex-direction: row;
    justify-content: space-between;

    & > span:first-child {
      margin-right: 0.5em;
    }
  }
`;

export function TwitterHandleTooltipPane() {
  return (
    <div>
      <Sub>
        You may connect your account to <White>Twitter</White>
        <br />
        to identify yourself on the <White>Leaderboard</White>.
      </Sub>
    </div>
  );
}

export function RankTooltipPane() {
  return (
    <div>
      <Sub>
        Your current rank, based on <White>score</White>.
      </Sub>
    </div>
  );
}

export function ScoreTooltipPane() {
  return (
    <div>
      <Sub>
        Your current score. <White>Score</White> is calculated as the sum of the
        total <br />
        <White>Energy Cap</White> of your top 10 planets plus 10 percent of your{' '}
        <br />
        planets' <White>total silver value</White>. (Cost of upgrades + current
        silver)
      </Sub>
    </div>
  );
}

export function MiningPauseTooltipPane() {
  return (
    <div>
      <Sub>
        Start / Stop your <White>explorer</White>. Your explorerer looks for
        planets in chunks of <White>16</White> x <White>16</White>.
      </Sub>
    </div>
  );
}

export function MiningTargetTooltipPane() {
  return (
    <div>
      <Sub>
        Change the location of your <White>explorer</White>. Click anywhere on
        the <White>Game Screen</White>, <br />
        and your <White>miner</White> will start hashing around that chunk.
      </Sub>
    </div>
  );
}

export function HashesPerSecTooltipPane() {
  return (
    <div>
      <Sub>
        The speed of your <White>explorer</White>, in <White>hashes</White> per
        second.
      </Sub>
    </div>
  );
}

export function CurrentMiningTooltipPane() {
  return (
    <div>
      <Sub>
        The current coordinates of your <White>explorer</White>.
      </Sub>
    </div>
  );
}

export function BonusTooltipPane() {
  return (
    <div>
      <Green>This stat has been randomly doubled!</Green>
    </div>
  );
}

export function SilverTooltipPane() {
  return (
    <div>
      <Sub>
        <White>Silver:</White> the universe's monetary resource. It allows you
        to buy upgrades. <br />
        Only <White>silver mines</White> produce silver. They're much rarer than
        planets!
      </Sub>
    </div>
  );
}

export function EnergyTooltipPane() {
  return (
    <div>
      <Sub>
        <White>Energy:</White> Energy allows you to make moves. <br />
        Energy grows following an <White>S-curve</White>, and grows fastest at{' '}
        <White>50% capacity</White>.
      </Sub>
    </div>
  );
}

export function SelectedEnergyTooltipPane() {
  const selected = useContext<Planet | null>(SelectedContext);

  return (
    <div>
      {selected ? (
        <TooltipInfo>
          <div>
            <Sub>Energy:</Sub>
            <span>{selected.energy}</span>
          </div>
          <div>
            <Sub>Growth:</Sub>
            <span>{selected.energyGrowth}</span>
          </div>
        </TooltipInfo>
      ) : (
          <>Select a planet to view more about its stats.</>
        )}
    </div>
  );
}

export function PlanetRankTooltipPane() {
  const selected = useContext<Planet | null>(SelectedContext);
  const rank = getPlanetRank(selected);
  return (
    <div>
      <Sub>
        This planet is{' '}
        <White>
          {isFullRank(selected) ? 'fully upgraded' : 'rank ' + rank}
        </White>
        !
      </Sub>
    </div>
  );
}

export function MaxLevelTooltipPane() {
  return (
    <div>
      <Sub>
        This planet is <White>Level 7</White>, making it one of the <br />
        most powerful planets in the galaxy!
      </Sub>
    </div>
  );
}

export function SilverProdTooltipPane() {
  return (
    <div>
      <Sub>
        This planet produces <White>Silver</White>! Use it to buy upgrades!
      </Sub>
    </div>
  );
}

export function SelectedSilverTooltipPane() {
  const selected = useContext<Planet | null>(SelectedContext);

  return (
    <div>
      {selected ? (
        <TooltipInfo>
          <div>
            <Sub>Silver:</Sub>
            <span>{selected.silver}</span>
          </div>
          <div>
            <Sub>Cap:</Sub>
            <span>{selected.silverCap}</span>
          </div>
          {selected.planetResource === PlanetResource.SILVER ? (
            <div>
              <Sub>Growth:</Sub>
              <span>{selected.silverGrowth * 60}</span>
            </div>
          ) : (
              <div>
                <Red>This planet does not produce silver.</Red>
              </div>
            )}
        </TooltipInfo>
      ) : (
          <>Select a planet to view more about its stats.</>
        )}
    </div>
  );
}

export function RangeTooltipPane() {
  return (
    <div>
      <Sub>
        <White>Range:</White> how far you can send your forces.{' '}
        <White>Forces decay</White> the farther out you send them. <br />
        Higher range means that you can send forces the same distance with less
        decay.
      </Sub>
    </div>
  );
}

export function MinEnergyTooltipPane() {
  return (
    <div>
      <Sub>
        The minimum energy you need to send a move from this planet. <br />
        Moves incur a base cost of 5% of the planet's <White>Energy Cap</White>.
      </Sub>
    </div>
  );
}

export function Time50TooltipPane() {
  return (
    <div>
      <Sub>
        Time to <White>50%</White> of full energy.
      </Sub>
    </div>
  );
}

export function Time90TooltipPane() {
  return (
    <div>
      <Sub>
        Time to <White>90%</White> of full energy. Since energy grows on an{' '}
        <br />
        s-curve, energy growth slows drastically by this point.
      </Sub>
    </div>
  );
}

export function EnergyGrowthTooltipPane() {
  return (
    <div>
      <Sub>
        <White>Energy Growth:</White> the maximum growth rate of this planet's
        energy <br />
        representing the rate at the middle of the <White>s-curve</White>.
      </Sub>
    </div>
  );
}

export function SilverGrowthTooltipPane() {
  return (
    <div>
      <Sub>
        <White>Silver Growth</White>: the per-minute linear growth rate of this
        planet's silver.
      </Sub>
    </div>
  );
}

export function SilverCapTooltipPane() {
  return (
    <div>
      <Sub>
        <White>Silver Cap</White>: the maximum silver that this planet can hold.
      </Sub>
    </div>
  );
}

export function PiratesTooltipPane() {
  return (
    <div>
      <Sub>
        <Red>This planet has space pirates!</Red> Unoccupied planets must first
        be defeated <br /> before they can be conquered.
      </Sub>
    </div>
  );
}

export function UpgradesTooltipPane() {
  return (
    <div>
      <Sub>
        <White>Planet Rank</White>: the number of times you've upgraded your
        planet.
      </Sub>
    </div>
  );
}

export function ModalHelpTooltipPane() {
  return <div>View patch notes and instruction</div>;
}

export function ModalPlanetDetailsTooltipPane() {
  return <div>View detailed information about the selected planet</div>;
}

export function ModalLeaderboardTooltipPane() {
  return <div>View the top players, and their top planets</div>;
}

export function ModalPlanetDexTooltipPane() {
  return <div>View a list of your planets</div>;
}

export function ModalEnergyDexTooltipPane() {
  return <div>View a list of your planets</div>;
}

export function ModalUpgradeDetailsTooltipPane() {
  return <div>Upgrade the selected planet</div>;
}

export function ModalTwitterVerificationTooltipPane() {
  return <div>Connect your address to Twitter</div>;
}

export function ModalTwitterBroadcastTooltipPane() {
  return <div>Broadcast the selected planet's coordinates to Twitter</div>;
}

export function BonusEnergyCapTooltipPane() {
  return (
    <div>
      <Green>
        This planet's <White>Energy Cap</White> has been randomly doubled!
      </Green>
    </div>
  );
}

export function BonusEnergyGroTooltipPane() {
  return (
    <div>
      <Green>
        This planet's <White>Energy Growth</White> has been randomly doubled!
      </Green>
    </div>
  );
}

export function BonusRangeTooltipPane() {
  return (
    <div>
      <Green>
        This planet's <White>Range</White> has been randomly doubled!
      </Green>
    </div>
  );
}

export function BonusSpeedTooltipPane() {
  return (
    <div>
      <Green>
        This planet's <White>Speed</White> has been randomly doubled!
      </Green>
    </div>
  );
}

export function BonusDefenseTooltipPane() {
  return (
    <div>
      <Green>
        This planet's <White>Defense</White> has been randomly doubled!
      </Green>
    </div>
  );
}

export function ClowntownTooltipPane() {
  const selected = useContext<Planet | null>(SelectedContext);
  const uiManager = useContext<GameUIManager | null>(GameUIManagerContext);
  const [account, setAccount] = useState<EthAddress | null>(null);

  // sync account and twitter
  useEffect(() => {
    if (!uiManager) return;
    setAccount(uiManager.getAccount());
  }, [uiManager]);

  return (
    <div>
      <span>
        {selected?.owner === account
          ? `You are the proud mayor of Clown Town!`
          : `It's a town of clowns...`}
      </span>
    </div>
  );
}

function DefenseTooltipPane() {
  return <div>Planets with higher defense are more resistant to attack.</div>;
}

function SpeedTooltipPane() {
  return (
    <div>
      Moves sent out from planets with higher speed travel the universe faster.
    </div>
  );
}

export function TooltipContent({ name }: { name: TooltipName }) {
  if (name === TooltipName.SilverGrowth) return <SilverGrowthTooltipPane />;
  if (name === TooltipName.SilverCap) return <SilverCapTooltipPane />;
  if (name === TooltipName.Silver) return <SilverTooltipPane />;
  if (name === TooltipName.Energy) return <EnergyTooltipPane />;
  if (name === TooltipName.EnergyGrowth) return <EnergyGrowthTooltipPane />;
  if (name === TooltipName.Range) return <RangeTooltipPane />;
  if (name === TooltipName.TwitterHandle) return <TwitterHandleTooltipPane />;
  if (name === TooltipName.Bonus) return <BonusTooltipPane />;
  if (name === TooltipName.MinEnergy) return <MinEnergyTooltipPane />;
  if (name === TooltipName.Time50) return <Time50TooltipPane />;
  if (name === TooltipName.Time90) return <Time90TooltipPane />;
  if (name === TooltipName.Pirates) return <PiratesTooltipPane />;
  if (name === TooltipName.Upgrades) return <UpgradesTooltipPane />;
  if (name === TooltipName.PlanetRank) return <PlanetRankTooltipPane />;
  if (name === TooltipName.MaxLevel) return <MaxLevelTooltipPane />;
  if (name === TooltipName.SelectedSilver) return <SelectedSilverTooltipPane />;
  if (name === TooltipName.SelectedEnergy) return <SelectedEnergyTooltipPane />;
  if (name === TooltipName.Rank) return <RankTooltipPane />;
  if (name === TooltipName.Score) return <ScoreTooltipPane />;
  if (name === TooltipName.MiningPause) return <MiningPauseTooltipPane />;
  if (name === TooltipName.MiningTarget) return <MiningTargetTooltipPane />;
  if (name === TooltipName.HashesPerSec) return <HashesPerSecTooltipPane />;
  if (name === TooltipName.CurrentMining) return <CurrentMiningTooltipPane />;
  if (name === TooltipName.SilverProd) return <SilverProdTooltipPane />;
  if (name === TooltipName.BonusEnergyCap) return <BonusEnergyCapTooltipPane />;
  if (name === TooltipName.BonusEnergyGro) return <BonusEnergyGroTooltipPane />;
  if (name === TooltipName.BonusRange) return <BonusRangeTooltipPane />;
  if (name === TooltipName.BonusSpeed) return <BonusSpeedTooltipPane />;
  if (name === TooltipName.BonusDefense) return <BonusDefenseTooltipPane />;
  if (name === TooltipName.Clowntown) return <ClowntownTooltipPane />;
  if (name === TooltipName.ModalHelp) return <ModalHelpTooltipPane />;
  if (name === TooltipName.ModalPlanetDetails)
    return <ModalPlanetDetailsTooltipPane />;
  if (name === TooltipName.ModalLeaderboard)
    return <ModalLeaderboardTooltipPane />;
  if (name === TooltipName.ModalPlanetDex) return <ModalPlanetDexTooltipPane />;
  if (name === TooltipName.ModalEnergyDex) return <ModalEnergyDexTooltipPane />;
  if (name === TooltipName.ModalUpgradeDetails)
    return <ModalUpgradeDetailsTooltipPane />;
  if (name === TooltipName.ModalTwitterVerification)
    return <ModalTwitterVerificationTooltipPane />;
  if (name === TooltipName.ModalTwitterBroadcast)
    return <ModalTwitterBroadcastTooltipPane />;
  if (name === TooltipName.Defense) return <DefenseTooltipPane />;
  if (name === TooltipName.Speed) return <SpeedTooltipPane />;

  return <></>;
}
