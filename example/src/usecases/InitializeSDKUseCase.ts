import type { SDKControlResult } from '../entities';
import type { ISDKRepository } from '../repositories';

export class InitializeSDKUseCase {
  constructor(private readonly sdkRepository: ISDKRepository) {}

  async execute(apiKey: string): Promise<SDKControlResult> {
    try {
      return await this.sdkRepository.initialize(apiKey);
    } catch (error) {
      console.error('Error initializing SDK:', error);
      throw error;
    }
  }
}
