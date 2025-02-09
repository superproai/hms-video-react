import React, { useCallback, useMemo, useRef } from 'react';
import { AudioLevelIndicatorProps } from '.';
import { hmsUiClassParserGenerator } from '../../utils/classes';
import { sigmoid } from '../../utils';
import { useHMSTheme } from '../../hooks/HMSThemeProvider';
import { useAudioLevel } from './useAudioLevel';
export interface AudioLevelIndicatorClasses {
  /**
   * Style attached to avatar
   */
  root?: string;
  /**
   * Style attached when display shape is circle
   */
  videoCircle?: string;
}

type AudioLevelBorderProps = Omit<AudioLevelIndicatorProps, 'type'>;

const defaultClasses: AudioLevelIndicatorClasses = {
  root: 'w-full h-full absolute left-0 top-0 rounded-lg',
  videoCircle: 'rounded-full',
};

export const AudioLevelBorder = ({
  level,
  color = '#FF7D0D',
  displayShape,
  classes,
  audioTrackId,
}: AudioLevelBorderProps) => {
  const { tw } = useHMSTheme();
  const styler = useMemo(
    () =>
      hmsUiClassParserGenerator<AudioLevelIndicatorClasses>({
        tw,
        classes,
        defaultClasses,
        tag: 'hmsui-audioLevelIndicator',
      }),
    [],
  );
  const getStyle = useCallback((level: number) => {
    const style: Record<string, string> = {
      transition: 'box-shadow 0.4s ease-in-out',
    };
    style['box-shadow'] = level
      ? `0px 0px ${24 * sigmoid(level)}px ${color}, 0px 0px ${16 *
          sigmoid(level)}px ${color}`
      : '';
    return style;
  }, []);

  const ref = useRef(null);
  useAudioLevel({ ref, getStyle, trackId: audioTrackId });

  return (
    <div
      className={`${styler('root')} ${
        displayShape === 'circle' ? styler('videoCircle') : ''
      }
        `}
      ref={ref}
    ></div>
  );
};
