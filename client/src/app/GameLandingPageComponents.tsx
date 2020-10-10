import styled, { css } from 'styled-components';
import dfstyles from '../styles/dfstyles.bs.js';
import React, { useLayoutEffect } from 'react';
import { InitRenderState } from './GameLandingPage';
import UIEmitter, { UIEmitterEvent } from '../utils/UIEmitter';

type LandingWrapperProps = {
  children: React.ReactNode;
  initRender: InitRenderState;
  terminalEnabled: boolean;
};

const StyledWrapper = styled.div<{
  initRender: InitRenderState;
  terminalEnabled: boolean;
}>`
  width: 100%;
  height: 100%;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: row;

  justify-content: ${(props) =>
    props.initRender !== InitRenderState.NONE
      ? 'space-between'
      : 'space-around'};
`;

export function Wrapper({
  children,
  initRender,
  terminalEnabled,
}: LandingWrapperProps): JSX.Element {
  return (
    <StyledWrapper initRender={initRender} terminalEnabled={terminalEnabled}>
      {children}
    </StyledWrapper>
  );
}

const STWInit = css`
  position: absolute;
  width: ${dfstyles.game.terminalWidth};
  right: 0;
  top: 0;
  padding: 1em;
  font-size: ${dfstyles.game.terminalFontSize};
`;

const STWNoInit = css`
  max-width: 60em;
  width: 60%;
  padding: 2em 0;
  font-size: ${dfstyles.fontSizeS};
`;

const StyledTerminalWrapper = styled.div<{
  initRender: InitRenderState;
  terminalEnabled: boolean;
}>`
  display: ${({ initRender, terminalEnabled }) => {
    if (initRender === InitRenderState.NONE) return 'block';
    else return terminalEnabled ? 'block' : 'none';
  }};
  border-left: ${({ terminalEnabled, initRender }) =>
    terminalEnabled && initRender !== InitRenderState.NONE
      ? `1px solid ${dfstyles.colors.text}`
      : 'none'};
  height: 100%;
  // overflow: hidden;
  background: ${dfstyles.colors.background};
  position: relative;

  ${(props) =>
    props.initRender !== InitRenderState.NONE ? STWInit : STWNoInit};

  @media (max-width: 660px) {
    width: 100%;
    padding: 1.5em 2em;
  }
`;

export function TerminalWrapper({
  children,
  initRender,
  terminalEnabled,
}: LandingWrapperProps): JSX.Element {
  return (
    <StyledTerminalWrapper
      initRender={initRender}
      terminalEnabled={terminalEnabled}
    >
      {children}
    </StyledTerminalWrapper>
  );
}

const StyledTerminalToggler = styled.div<{ terminalEnabled: boolean }>`
  position: absolute;
  right 0;
  top: 0;
  height: 100%;
  width: 1em;

  background: ${dfstyles.colors.text};
  z-index: 1000;

  color: ${dfstyles.colors.background};

  display: flex;
  flex-direction: column;
  justify-content: space-around;
  align-items: center;

  // transition: opacity 0.2s;
  opacity: 0;

  &:hover {
    opacity: 1;
    cursor: pointer;
  }

  & span {
    font-size: 1.25em;
    transform: scaleY(2);
  }
`;

export function TerminalToggler({
  terminalEnabled,
  setTerminalEnabled,
}: {
  terminalEnabled: boolean;
  setTerminalEnabled: (any) => void;
}): JSX.Element {
  const uiEmitter = UIEmitter.getInstance();
  useLayoutEffect(() => {
    uiEmitter.emit(UIEmitterEvent.UIChange);
  }, [terminalEnabled, uiEmitter]);

  return (
    <StyledTerminalToggler
      terminalEnabled={terminalEnabled}
      onClick={() => setTerminalEnabled((b) => !b)}
    >
      <span>{terminalEnabled ? '>' : '<'}</span>
    </StyledTerminalToggler>
  );
}

const StyledGameWindowWrapper = styled.div<{
  initRender: InitRenderState;
  terminalEnabled: boolean;
}>`
  background: ${dfstyles.colors.background};
  position: absolute;
  left: 0;
  top: 0;

  width: ${(props) =>
    props.terminalEnabled
      ? `calc(100% - ${dfstyles.game.terminalWidth})`
      : '100%'};
  height: 100%;

  display: ${(props) =>
    props.initRender !== InitRenderState.NONE ? 'block' : 'none'};
`;

export function GameWindowWrapper({
  children,
  initRender,
  terminalEnabled,
}: LandingWrapperProps): JSX.Element {
  return (
    <StyledGameWindowWrapper
      initRender={initRender}
      terminalEnabled={terminalEnabled}
    >
      {initRender && <>{children}</>}
    </StyledGameWindowWrapper>
  );
}

export const Hidden = styled.div`
  display: none;
  position: absolute;
  top: -10000;
  left: -10000;
`;
