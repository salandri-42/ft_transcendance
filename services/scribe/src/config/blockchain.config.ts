import { registerAs } from '@nestjs/config';

export default registerAs('blockchain', () => ({
  // Clé privée du wallet admin
  privateKey: process.env.PRIVATE_KEY,
  
  // RPC Avalanche
  rpcUrl: process.env.FUJI_RPC_URL || 'https://api.avax-test.network/ext/bc/C/rpc',
  
  // Smart contract déployé
  contractAddress: process.env.CONTRACT_ADDRESS,
  
  // IPFS (Pinata)
  pinata: {
    apiKey: process.env.PINATA_API_KEY,
    secretApiKey: process.env.PINATA_SECRET_API_KEY,
  },
  
  // Validation
  validate() {
    if (!this.privateKey) {
      throw new Error('❌ PRIVATE_KEY is required');
    }
    if (!this.contractAddress) {
      throw new Error('❌ CONTRACT_ADDRESS is required');
    }
    if (!this.pinata.apiKey || !this.pinata.secretApiKey) {
      throw new Error('❌ PINATA credentials are required');
    }
    
    console.log('✅ Blockchain config loaded successfully');
    console.log(`   Contract: ${this.contractAddress}`);
    console.log(`   RPC: ${this.rpcUrl}`);
  }
}));