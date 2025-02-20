import React, { useMemo } from 'react';
import { ButtonDisplayType } from '../../types';
import {
  HangUpIcon,
  MicOffIcon,
  MicOnIcon,
  CamOffIcon,
  CamOnIcon,
  ShareScreenIcon,
  ChatUnreadIcon,
} from '../Icons';
import { Button } from '../Button';
import { Settings } from '../Settings/Settings';
import { VerticalDivider } from '../VerticalDivider';
import { hmsUiClassParserGenerator } from '../../utils/classes';
import { useHMSTheme } from '../../hooks/HMSThemeProvider';

export interface ControlBarClasses {
  root?: string;
  leftRoot?: string;
  centerRoot?: string;
  rightRoot?: string;
}
export interface ControlBarProps {
  isAudioMuted?: boolean;
  isVideoMuted?: boolean;
  isChatOpen?: boolean;
  buttonDisplay?: ButtonDisplayType;

  audioButtonOnClick: React.MouseEventHandler;
  videoButtonOnClick: React.MouseEventHandler;
  leaveButtonOnClick?: React.MouseEventHandler;
  chatButtonOnClick?: React.MouseEventHandler;
  screenshareButtonOnClick?: React.MouseEventHandler;

  leftComponents: Array<React.ReactNode>;
  centerComponents: Array<React.ReactNode>;
  rightComponents: Array<React.ReactNode>;
  classes?: ControlBarClasses;
}

// Note: Column Gap is not supported in safari
const defaultClasses: ControlBarClasses = {
  root:
    'flex bg-white dark:bg-black h-full items-center p-3 mr-2 ml-2 justify-center md:justify-between relative',
  leftRoot: 'flex justify-center items-center z-10 space-x-2 md:space-x-3',
  centerRoot:
    'flex md:flex-1 mr-4 ml-2 md:ml-0 md:mr-0 justify-center items-center md:absolute md:left-0 md:right-0',
  rightRoot: 'z-10 items-center flex',
};

export const ControlBar = ({
  isAudioMuted = false,
  isVideoMuted = false,
  isChatOpen = false,
  buttonDisplay = 'rectangle',
  audioButtonOnClick,
  videoButtonOnClick,
  leaveButtonOnClick,
  chatButtonOnClick,
  screenshareButtonOnClick,
  leftComponents = [
    <Settings key={0} />,
    <VerticalDivider key={1} />,
    <Button
      iconOnly
      variant="no-fill"
      iconSize="md"
      classes={{ root: 'w-14' }}
      shape={buttonDisplay}
      onClick={screenshareButtonOnClick}
      key={2}
      label="Share"
    >
      <ShareScreenIcon />
    </Button>,
    <VerticalDivider key={3} />,
    <Button
      iconOnly
      variant="no-fill"
      iconSize="md"
      shape={buttonDisplay}
      onClick={chatButtonOnClick}
      active={isChatOpen}
      key={4}
      label="Chat"
    >
      <ChatUnreadIcon />
    </Button>,
  ],
  centerComponents = [
    <Button
      iconOnly
      variant="no-fill"
      iconSize="md"
      classes={{ root: 'mr-2' }}
      shape={buttonDisplay}
      active={isAudioMuted}
      onClick={audioButtonOnClick}
      key={0}
      label="Mic"
      id="hms-mic"
    >
      {isAudioMuted ? <MicOffIcon /> : <MicOnIcon />}
    </Button>,
    <Button
      iconOnly
      variant="no-fill"
      iconSize="md"
      shape={buttonDisplay}
      active={isVideoMuted}
      onClick={videoButtonOnClick}
      key={1}
      label="Video"
      id="hms-video"
    >
      {isVideoMuted ? <CamOffIcon /> : <CamOnIcon />}
    </Button>,
  ],
  rightComponents = [
    <Button
      size="md"
      shape={buttonDisplay}
      variant="danger"
      onClick={leaveButtonOnClick}
      icon={<HangUpIcon />}
      key={0}
    >
      Leave room
    </Button>,
  ],
  classes,
}: ControlBarProps) => {
  const { tw } = useHMSTheme();
  const styler = useMemo(
    () =>
      hmsUiClassParserGenerator<ControlBarClasses>({
        tw,
        classes,
        defaultClasses,
        tag: 'hmsui-controlbar',
      }),
    [],
  );

  const leftItems = Array<React.ReactNode>();
  const centerItems = Array<React.ReactNode>();
  const rightItems = Array<React.ReactNode>();

  centerComponents.forEach(comp => {
    centerItems.push(comp);
  });
  rightComponents.forEach(comp => {
    rightItems.push(comp);
  });

  leftComponents.forEach(comp => {
    leftItems.push(comp);
  });

  return (
    <div className={styler('root')}>
      <div className={styler('leftRoot')}>{leftItems}</div>
      <div className={styler('centerRoot')}>{centerItems}</div>
      <div className={styler('rightRoot')}>{rightItems}</div>
    </div>
  );
};
