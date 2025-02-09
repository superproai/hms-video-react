import React, { useMemo, useState, useCallback, useRef } from 'react';
import ClickAwayListener from 'react-click-away-listener';
import {
  HMSPeer,
  selectCameraStreamByPeerID,
  selectIsPeerAudioEnabled,
  selectIsAudioLocallyMuted,
  selectIsPeerVideoEnabled,
  selectScreenShareByPeerID,
  selectAudioTrackVolume,
  selectScreenShareAudioByPeerID,
  selectSimulcastLayerByTrack,
  HMSTrack,
  selectTrackByID,
  selectPermissions,
} from '@100mslive/hms-video-store';
import { HMSException, HMSSimulcastLayer } from '@100mslive/hms-video';
import { ContextMenu, ContextMenuItem } from '../ContextMenu';
import { Video, VideoProps, VideoClasses } from '../Video/Video';
import { VideoTileControls } from './Controls';
import { Avatar } from '../TwAvatar';
import {
  CamOffIcon,
  CamOnIcon,
  MicOffIcon,
  MicOnIcon,
  RemovePeerIcon,
  VolumeIcon,
  VideoExitFullScreenIcon,
  VideoFullScreenIcon,
  HandFilledIcon,
} from '../Icons';
import { Slider } from '../Slider/Slider';
import { Button } from '../Button';
import { useHMSTheme } from '../../hooks/HMSThemeProvider';
import { useHMSActions, useHMSStore } from '../../hooks/HMSRoomProvider';
import { getVideoTileLabel, toggleFullScreen } from '../../utils';
import { hmsUiClassParserGenerator } from '../../utils/classes';
import './index.css';
import { AudioLevelIndicator } from '../AudioLevelIndicators';
import { VideoTileStats } from './Stats';

export interface AdditionalVideoTileProps {
  children?: React.ReactNode;
  customAvatar?: React.ReactNode;

  /**
   * Array of <ContextMenuItem /> components
   */
  contextMenuItems?: JSX.Element[];
}

export interface VideoTileProps
  extends Omit<VideoProps, 'peerId'>,
    AdditionalVideoTileProps {
  /**
   * HMS Peer object for which the tile is shown.
   */
  peer: HMSPeer;

  /**
   * If showScreen is true, user's screenshare will be shown instead of camera
   */
  showScreen?: boolean;

  /**
   * Indicates if the stream's audio is muted or not. Ignored if showAudioMuteStatus is false.
   */
  isAudioMuted?: boolean;
  /**
   * Indicates if the stream's video is muted or not. Ignored if showVideoMuteStatus is false.
   */
  isVideoMuted?: boolean;
  /**
   * Indicates whether to show the stream's audio mute status. Needs isAudioMuted value to display the status.
   */
  showAudioMuteStatus?: boolean;
  /**
   * Aspect ratio of the video container(if objectFit is set to 'cover').
   * If aspectRatio is defined, the video container expands to fit the largest rectangle maintaining the aspec ratio.
   * If aspectRatio is not defined, the video container takes the parent's width and height.
   * Ignored when displayShape is 'circle' or objectFit is 'contain'.
   */
  aspectRatio?: {
    width: number;
    height: number;
  };
  /**
   * Indicates whether to show controls for remote muting/unmuting other participants.
   */
  allowRemoteMute?: boolean;
  /**
   * Custom controls component to display label, audio mute status, audio level, remote mute control.
   * Default is VideoTileControls.
   */
  controlsComponent?: React.ReactNode;
  /**
   * extra classes added  by user
   */
  classes?: VideoTileClasses;

  avatarType?: 'initial';

  /**
   * Boolean variable to specify if videoTile is small or not
   */
  compact?: boolean;

  /**
   * Boolean variable to specify if hand is raised
   */
  isHandRaised?: boolean;

  /**
   * Boolean variable to specify if stats overlay should be shown
   */
  showStats?: boolean;
}

export interface VideoTileClasses extends VideoClasses {
  /**
   * The top-level container.
   */
  root?: string;
  /**
   * The video container.
   */
  videoContainer?: string;
  /**
   * The avatar container.
   */
  avatarContainer?: string;
  /**
   * Classes added to Avatar container if its a circle
   */
  avatarContainerCircle?: string;
  /**
   * Classes added to Video container if its a circle
   */
  videoContainerCircle?: string;
  /**
   * Classes added to fullscreen control
   */
  fullScreenControl?: string;
  /**
   * Classes added to raisehand control
   */
  raiseHand?: string;
}

const defaultClasses: VideoTileClasses = {
  root: 'group w-full h-full flex relative justify-center rounded-lg min-h-0',
  videoContainer: 'relative rounded-lg object-cover relative w-full max-h-full',
  avatarContainer:
    'absolute w-full h-full top-0 left-0 z-10 bg-gray-100 flex items-center justify-center rounded-lg',
  videoContainerCircle: 'rounded-full',
  fullScreenControl: 'flex items-end justify-end h-full px-2',
  raiseHand: 'absolute bottom-3 left-3 z-10',
};

const customClasses: VideoTileClasses = {
  root: 'hmsui-videoTile-showControlsOnHoverParent',
};

const Tile = ({
  videoTrack,
  peer,
  hmsVideoTrackId,
  hmsVideoTrack,
  showScreen = false,
  audioLevel = 0,
  isAudioMuted,
  isVideoMuted,
  showAudioMuteStatus = true,
  showAudioLevel,
  objectFit = 'cover',
  aspectRatio,
  displayShape = 'rectangle',
  audioLevelDisplayType = 'border',
  audioLevelDisplayColor,
  controlsComponent,
  classes,
  avatarType,
  customAvatar,
  contextMenuItems,
  isHandRaised,
  showStats = false,
  compact,
  children,
}: VideoTileProps) => {
  const { appBuilder, tw, tailwindConfig, toast } = useHMSTheme();
  const hmsActions = useHMSActions();
  const [showMenu, setShowMenu] = useState(false);
  const [showTrigger, setShowTrigger] = useState(false);
  const styler = useMemo(
    () =>
      hmsUiClassParserGenerator<VideoTileClasses>({
        tw,
        classes,
        customClasses,
        defaultClasses,
        tag: 'hmsui-videoTile',
      }),
    [],
  );

  audioLevelDisplayColor =
    audioLevelDisplayColor ||
    tailwindConfig.theme.extend.colors.brand.main ||
    '#0F6CFF';

  const selectVideoByPeerID = showScreen
    ? selectScreenShareByPeerID
    : selectCameraStreamByPeerID;

  const storeHmsVideoTrack = useHMSStore(selectVideoByPeerID(peer.id));
  const storeIsAudioMuted = !useHMSStore(selectIsPeerAudioEnabled(peer.id));
  const storeIsVideoMuted = !useHMSStore(selectIsPeerVideoEnabled(peer.id));
  const screenshareAudioTrack = useHMSStore(
    selectScreenShareAudioByPeerID(peer.id),
  );
  const tileAudioTrack = showScreen
    ? screenshareAudioTrack?.id
    : peer.audioTrack;
  const storeHmsAudioTrack = useHMSStore(selectTrackByID(tileAudioTrack));
  const simulcastLayer = useHMSStore(
    selectSimulcastLayerByTrack(storeHmsVideoTrack?.id),
  );

  const updateSimulcastLayer = (layer: HMSSimulcastLayer) => {
    hmsActions.setPreferredLayer(storeHmsVideoTrack?.id!, layer);
    setShowMenu(false);
  };

  const toggleTrackEnabled = async (track?: HMSTrack | null) => {
    if (track) {
      try {
        await hmsActions.setRemoteTrackEnabled(track.id, !track.enabled);
      } catch (error) {
        toast((error as HMSException).message);
      }
    }
  };

  const storeAudioTrackVolume = useHMSStore(
    selectAudioTrackVolume(tileAudioTrack),
  );
  const storeIsLocallyMuted = useHMSStore(
    selectIsAudioLocallyMuted(tileAudioTrack),
  );
  const permissions = useHMSStore(selectPermissions);

  if (showAudioLevel === undefined) {
    showAudioLevel = !showScreen; // don't show audio levels for screenshare
  }

  if (!showScreen && (isAudioMuted === undefined || isAudioMuted === null)) {
    isAudioMuted = storeIsAudioMuted;
  }

  if (!showScreen && (isVideoMuted === undefined || isVideoMuted === null)) {
    isVideoMuted = storeIsVideoMuted || Boolean(storeHmsVideoTrack?.degraded);
  }

  const label = getVideoTileLabel(
    peer.name,
    peer.isLocal,
    storeHmsVideoTrack?.source,
    storeIsLocallyMuted,
    storeHmsVideoTrack?.degraded,
  );

  const layerDefinitions = storeHmsVideoTrack?.layerDefinitions || [];

  try {
    if (aspectRatio === undefined) {
      aspectRatio = appBuilder.videoTileAspectRatio;
    }
    if (avatarType === undefined) {
      avatarType = appBuilder.avatarType;
    }
  } catch (e) {}
  avatarType = avatarType || 'initial';

  let { width, height } = { width: 1, height: 1 };
  if (storeHmsVideoTrack) {
    if (storeHmsVideoTrack?.width && storeHmsVideoTrack.height) {
      width = storeHmsVideoTrack.width;
      height = storeHmsVideoTrack.height;
    }
  } else if (videoTrack) {
    let trackSettings = videoTrack.getSettings();
    width = trackSettings.width || width;
    height = trackSettings.height || width;
  }

  const getMenuItems = useCallback(() => {
    const children: JSX.Element[] = [];

    if (
      storeHmsAudioTrack &&
      (storeHmsAudioTrack?.enabled && permissions?.mute)
    ) {
      children.push(
        <ContextMenuItem
          icon={storeHmsAudioTrack?.enabled ? <MicOnIcon /> : <MicOffIcon />}
          label={`${storeHmsAudioTrack?.enabled ? 'Mute Audio' : ''} `}
          key="remoteMuteAudio"
          onClick={() => toggleTrackEnabled(storeHmsAudioTrack)}
        />,
      );
    }

    if (
      !showScreen &&
      (storeHmsVideoTrack?.enabled && permissions?.mute)
    ) {
      children.push(
        <ContextMenuItem
          icon={storeHmsVideoTrack?.enabled ? <CamOnIcon /> : <CamOffIcon />}
          label={`${storeHmsVideoTrack?.enabled ? 'Mute Video' : ''} `}
          key="remoteMuteVideo"
          onClick={() => toggleTrackEnabled(storeHmsVideoTrack)}
        />,
      );
    }

    if (permissions?.mute && permissions?.changeRole && peer.roleName != 'host') {
      children.push(
        <ContextMenuItem
          icon={(peer.roleName == 'guest' || peer.roleName == 'speaker' || peer.roleName == 'mutecamera') ? <MicOnIcon /> : <MicOffIcon />}
          label={`${peer.roleName == 'guest' || peer.roleName == 'speaker' || peer.roleName == 'mutecamera' ? 'Disable Mic' : 'Enable Mic'} `}
          key="remoteDisableAudio"
          onClick={() => {
            
            let role = (peer.roleName == 'guest' || peer.roleName == 'mutecamera') ? 'mutecameramic' : 'mutecamera';
            hmsActions.changeRole(peer.id, role, true);          
          }}
        />,
      );
    }

    if (permissions?.mute && permissions?.changeRole && peer.roleName != 'host')
     {
      children.push(
        <ContextMenuItem
          icon={peer.roleName == 'guest' ? <CamOnIcon /> : <CamOffIcon />}
          label={`${peer.roleName == 'guest' ? 'Disable Camera' : 'Enable Camera'} `}
          key="remoteDisableVideo"
          onClick={() => {
            let role = (peer.roleName == 'guest') ? 'mutecamera' : 'guest';
            hmsActions.changeRole(peer.id, role, true);          
          }}
        />,
      );
    }

    

    if (!showScreen || !!screenshareAudioTrack) {
      children.push(
        <ContextMenuItem
          label="Volume"
          key="volume"
          icon={<VolumeIcon />}
          closeMenuOnClick={false}
          onClick={() => {}}
        >
          <Slider
            value={storeAudioTrackVolume}
            //@ts-ignore
            onChange={(_, newValue) => {
              if (typeof newValue === 'number') {
                hmsActions.setVolume(newValue, tileAudioTrack);
              }
            }}
            aria-labelledby="continuous-slider"
            valueLabelDisplay="auto"
            marks={[
              { value: 0 },
              { value: 25 },
              { value: 50 },
              { value: 75 },
              { value: 100 },
            ]}
            valueLabelFormat={value => Math.floor(value)}
          />
        </ContextMenuItem>,
      );
    }

    children.push(
      ...layerDefinitions.map(({ layer, resolution }) => {
        return (
          <ContextMenuItem
            label={`${layer.toUpperCase()} (${resolution.width}x${
              resolution.height
            })`}
            key={layer}
            active={simulcastLayer === layer}
            onClick={() => updateSimulcastLayer(layer)}
          />
        );
      }),
    );

    if (permissions?.removeOthers && !showScreen) {
      children.push(
        <ContextMenuItem
          label="Remove Participant"
          classes={{
            menuTitle: 'text-red-500 dark:text-red-500',
            menuIcon: 'text-red-500 dark:text-red-500',
          }}
          key="removeParticipant"
          addDivider
          icon={<RemovePeerIcon />}
          onClick={async () => {
            try {
              await hmsActions.removePeer(peer.id, '');
            } catch (error) {
              toast((error as HMSException).message);
            }
          }}
        />,
      );
    }

    return children;
  }, [
    layerDefinitions,
    showScreen,
    storeHmsVideoTrack,
    storeHmsAudioTrack,
    permissions,
    screenshareAudioTrack,
    tileAudioTrack,
    simulcastLayer,
  ]);

  const tileAvatar = useMemo(
    () =>
      customAvatar ? (
        customAvatar
      ) : (
        <Avatar label={peer.name} avatarType={avatarType} />
      ),
    [peer],
  );

  const impliedAspectRatio =
    aspectRatio && objectFit === 'cover' ? aspectRatio : { width, height };

  const [isFullScreen, setIsFullScreen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const handleFullScreen = async () => {
    if (!rootRef.current) {
      return;
    }
    const fs = await toggleFullScreen(rootRef.current, !isFullScreen);
    if (fs !== undefined) {
      setIsFullScreen(fs);
    }
  };

  return (
    <ClickAwayListener onClickAway={() => setShowTrigger(false)}>
      <div
        className={styler('root')}
        onMouseEnter={() => setShowTrigger(true)}
        onMouseLeave={() => {
          setShowTrigger(false);
        }}
        ref={rootRef}
      >
        {!peer.isLocal && (showMenu || showTrigger) && (
          <ContextMenu
            menuOpen={showMenu}
            onTrigger={value => setShowMenu(value)}
          >
            {contextMenuItems || getMenuItems()}
          </ContextMenu>
        )}
        {((impliedAspectRatio.width && impliedAspectRatio.height) ||
          objectFit === 'contain') && (
          <div
            className={`${styler('videoContainer')} ${
              displayShape === 'circle' ? styler('videoContainerCircle') : ''
            } `}
            style={
              objectFit !== 'contain'
                ? {
                    aspectRatio: `${
                      displayShape === 'rectangle'
                        ? impliedAspectRatio.width / impliedAspectRatio.height
                        : 1
                    }`,
                  }
                : { objectFit: 'contain', width: '100%', height: '100%' }
            }
          >
            {isHandRaised && !showScreen && (
              <HandFilledIcon
                className={`${styler('raiseHand')}`}
                width="40"
                height="40"
              />
            )}
            {showStats && (
              <VideoTileStats
                audioTrackID={storeHmsAudioTrack?.id}
                videoTrackID={hmsVideoTrack?.id || storeHmsVideoTrack?.id}
                compact={compact}
              />
            )}
            {/* TODO this doesn't work in Safari and looks ugly with contain*/}
            <Video
              hmsVideoTrackId={
                hmsVideoTrackId || hmsVideoTrack?.id || storeHmsVideoTrack?.id
              }
              videoTrack={videoTrack}
              objectFit={objectFit}
              isLocal={peer.isLocal}
              displayShape={displayShape}
            />
            {showAudioLevel && audioLevelDisplayType === 'border' && (
              <AudioLevelIndicator
                audioTrackId={tileAudioTrack}
                type={'border'}
                level={audioLevel}
                displayShape={displayShape}
                classes={{
                  videoCircle: styler('videoCircle'),
                  root: styler('borderAudioRoot'),
                }}
                color={audioLevelDisplayColor}
              />
            )}
            {isVideoMuted && (
              <div
                className={`${styler('avatarContainer')} ${
                  displayShape === 'circle'
                    ? styler('avatarContainerCircle')
                    : ''
                }`}
              >
                {isHandRaised && !showScreen && (
                  <HandFilledIcon
                    className={`${styler('raiseHand')}`}
                    width="40"
                    height="40"
                  />
                )}
                {showStats && (
                  <VideoTileStats
                    audioTrackID={storeHmsAudioTrack?.id}
                    videoTrackID={hmsVideoTrack?.id || storeHmsVideoTrack?.id}
                    compact={compact}
                  />
                )}
                {tileAvatar}
              </div>
            )}
            {controlsComponent ? (
              controlsComponent
            ) : (
              // TODO circle controls are broken now
              <VideoTileControls
                isLocal={peer.isLocal}
                label={label}
                isAudioMuted={isAudioMuted}
                showAudioMuteStatus={showAudioMuteStatus}
                showGradient={displayShape === 'circle'}
              />
            )}
            {showScreen && showTrigger && (
              <div className={styler('fullScreenControl')}>
                <Button
                  key="fullscreen"
                  iconOnly
                  variant="no-fill"
                  iconSize="md"
                  shape="circle"
                  active={true}
                  classes={{
                    root: 'cursor-pointer z-10 mb-2',
                    rootIconOnlyStandardActive:
                      'dark:bg-gray-300 dark:text-white text-black dark:hover:bg-gray-300 hover:bg-white',
                  }}
                  onClick={handleFullScreen}
                >
                  {isFullScreen ? (
                    <VideoExitFullScreenIcon />
                  ) : (
                    <VideoFullScreenIcon />
                  )}
                </Button>
              </div>
            )}
          </div>
        )}
        {children}
      </div>
    </ClickAwayListener>
  );
};

export const VideoTile = React.memo(Tile);
