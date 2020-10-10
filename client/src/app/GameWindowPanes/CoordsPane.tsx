import React, { useState, useEffect, useContext } from 'react';
import { WorldCoords } from '../../utils/Coordinates';
import UIEmitter, { UIEmitterEvent } from '../../utils/UIEmitter';
import styled from 'styled-components';
import perlin from '../../miner/perlin';
import { SpaceType } from '../../_types/global/GlobalTypes';
import GameUIManager from '../board/GameUIManager';
import GameUIManagerContext from '../board/GameUIManagerContext';

export function CoordsText(): JSX.Element {
  const uiEmitter = UIEmitter.getInstance();
  const [coords, setCoords] = useState<WorldCoords | null>(null);

  const uiManager = useContext<GameUIManager | null>(GameUIManagerContext);

  useEffect(() => {
    uiEmitter.on(UIEmitterEvent.WorldMouseMove, setCoords);
    return () => {
      uiEmitter.removeListener(UIEmitterEvent.WorldMouseMove, setCoords);
    };
  }, [uiEmitter]);

  const p = (vec: WorldCoords): string => {
    if (uiManager) {
      const per = perlin(vec, false);
      const spaceType = uiManager.spaceTypeFromPerlin(per);

      let suff = '';
      if (spaceType === SpaceType.NEBULA) suff = '\u00b0 (NEBULA)';
      else if (spaceType === SpaceType.SPACE) suff = '\u00b0 (SPACE)';
      else if (spaceType === SpaceType.DEEP_SPACE) suff = '\u00b0 (DEEP SPACE)';

      return `${Math.floor((16 - per) * 16)}${suff}`;
    }
    return '???';
  };

  return (
    <>
      <span>
        {coords
          ? `(${Math.round(coords.x)}, ${Math.round(coords.y)})`
          : '(x, y)'}
      </span>
      <span>TEMP: {coords ? p(coords) : '???'}</span>
    </>
  );
}

const StyledCoordsPane = styled.div`
  position: absolute;
  bottom: 0;
  right: 0;
  padding: 0.5em;

  text-align: right;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;

  width: 16em;
  height: 4em;
`;
export function CoordsPane(): JSX.Element {
  const [hovering, setHovering] = useState<boolean>(false);
  const [hidden, setHidden] = useState<boolean>(false);

  return (
    <StyledCoordsPane
      onClick={() => setHidden((b) => !b)}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
    >
      {hidden ? (
        <span>{hovering ? 'Click to show' : ''}</span>
      ) : hovering ? (
        <span>Click to hide</span>
      ) : (
            <CoordsText />
          )}
    </StyledCoordsPane>
  );
}
