import HMSConfig from '@100mslive/100ms-web-sdk/dist/interfaces/config';
import HMSPeer from '@100mslive/100ms-web-sdk/dist/interfaces/hms-peer';
import HMSUpdateListener from '@100mslive/100ms-web-sdk/dist/interfaces/update-listener';

export default interface HMSRoomProps {
  peers: HMSPeer[];
  localPeer: HMSPeer;
  audioMuted: boolean;
  videoMuted: boolean;
  join: (config: HMSConfig, listener: HMSUpdateListener) => void;
  leave: () => void;
  toggleMute: (type: 'audio' | 'video') => void;
  toggleScreenShare: () => void;
}
