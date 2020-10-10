import React from 'react';
import styled from 'styled-components';
import dfstyles from '../../styles/dfstyles.bs.js';
import { PaneProps, StyledToolbarPane } from './GameWindowComponents';
import { ModalHook, ModalName, ModalIcon } from '../GameWindowPanes/ModalPane';

const StyledToolbar = styled.div`
  // position and sizing
  height: ${dfstyles.game.toolbarHeight};
  width: 100%;
  position: absolute;
  bottom: 0;

  // styling
  background: ${dfstyles.colors.background};
  border-top: 1px solid ${dfstyles.colors.text};

  // display children
  display: flex;
  flex-direction: row;
`;

export function Toolbar({ children }: { children: React.ReactNode }): JSX.Element {
  return <StyledToolbar>{children}</StyledToolbar>;
}

export function ToolbarPane({
  children,
  title,
  headerStyle = undefined,
  hook,
  modal,
}: PaneProps & { hook: ModalHook; modal: ModalName }): JSX.Element {
  return (
    <StyledToolbarPane>
      <div className='pane-header'>
        <p style={headerStyle}>{title}</p>
        <a>
          <ModalIcon modal={modal} hook={hook} />
        </a>
      </div>
      <div className='pane-content'>{children}</div>
    </StyledToolbarPane>
  );
}
