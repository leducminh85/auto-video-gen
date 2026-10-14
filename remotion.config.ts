import {Config} from '@remotion/cli/config';

Config.setVideoImageFormat('png');
Config.setCodec('h264');
Config.setCrf(16);
Config.setEntryPoint('./src/index.ts');
Config.setStudioPort(3001);
Config.overrideWebpackConfig((config) => ({
  ...config,
  experiments: {
    ...config.experiments,
    lazyCompilation: false,
  },
}));
