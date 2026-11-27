import { BadRequestException, Controller, Get, Query } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Env } from '../../config/env.js';

export interface AppVersionInfo {
  platform: 'android';
  latestVersion: string;
  minSupportedVersion: string;
  downloadUrl: string | null;
}

/**
 * Lets the app tell the user an update exists, or block a version that is
 * no longer safe to run. Values come from environment configuration, so a
 * release needs no code change here.
 */
@Controller({ path: 'app-version', version: '1' })
export class AppVersionController {
  constructor(private readonly config: ConfigService<Env, true>) {}

  @Get()
  get(@Query('platform') platform = 'android'): AppVersionInfo {
    if (platform !== 'android') {
      throw new BadRequestException(`Unsupported platform "${platform}"`);
    }
    return {
      platform,
      latestVersion: this.config.get('ANDROID_LATEST_VERSION', { infer: true }),
      minSupportedVersion: this.config.get('ANDROID_MIN_SUPPORTED_VERSION', {
        infer: true,
      }),
      downloadUrl:
        this.config.get('ANDROID_DOWNLOAD_URL', { infer: true }) ?? null,
    };
  }
}
