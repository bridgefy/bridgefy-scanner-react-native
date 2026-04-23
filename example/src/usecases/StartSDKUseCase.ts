import type { SDKControlResult } from '../entities';
import type { ISDKRepository } from '../repositories';

export class StartSDKUseCase {
  constructor(private readonly sdkRepository: ISDKRepository) {}

  async execute(userId: string | undefined | null): Promise<SDKControlResult> {
    try {
      return await this.sdkRepository.start(userId);
    } catch (error) {
      console.error('Error starting SDK:', error);
      throw error;
    }
  }
}
