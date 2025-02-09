import { HMSPeer, HMSTrack, HMSTrackID } from '@100mslive/hms-video-store';

export type TrackWithPeer = { track?: HMSTrack; peer: HMSPeer };

export const getVideoTracksFromPeers = (
  peers: HMSPeer[],
  tracks: Record<HMSTrackID, HMSTrack>,
  showScreenFn: (peer: HMSPeer) => boolean,
  showTileForAllPeers = false,
) => {
  if (!peers || !tracks || !showScreenFn) {
    return [];
  }
  const videoTracks: TrackWithPeer[] = [];
  for (let peer of peers) {
    // Show tile even if no video or audio tracks are there
    if(peer.videoTrack === undefined && peer.audioTrack === undefined) {
      videoTracks.push({ peer: peer });
    }
    else if (
      peer.videoTrack === undefined &&
      peer.audioTrack &&
      tracks[peer.audioTrack]
    ) {
      videoTracks.push({ peer: peer });
    } else if (peer.videoTrack && tracks[peer.videoTrack]) {
      videoTracks.push({ track: tracks[peer.videoTrack], peer: peer });
    } else if (showScreenFn(peer) && peer.auxiliaryTracks.length > 0) {
      const screenShareTrackID = peer.auxiliaryTracks.find(trackID => {
        const track = tracks[trackID];
        return track?.type === 'video' && track?.source === 'screen';
      });

      // Don't show tile if screenshare only has audio
      if (screenShareTrackID) {
        videoTracks.push({ track: tracks[screenShareTrackID], peer: peer });
      }
    } else if (showTileForAllPeers) {
      videoTracks.push({ peer: peer });
    }
  }
  return videoTracks;
};
