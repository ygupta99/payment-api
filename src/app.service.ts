/* eslint-disable @typescript-eslint/no-empty-function */
import { Injectable, Logger } from '@nestjs/common';

import { createRaribleSdk } from '@rarible/protocol-ethereum-sdk';
const Web3 = require('web3');
import { Web3Ethereum } from '@rarible/web3-ethereum';
import {
  isErc1155v1Collection,
  isErc1155v2Collection,
  isErc721v1Collection,
  isErc721v2Collection,
  isErc721v3Collection,
  RaribleSdk,
} from '@rarible/protocol-ethereum-sdk';
import { toAddress, toBigNumber } from '@rarible/types';

// const HDWalletProvider = require('@truffle/hdwallet-provider');
const HDWalletProvider = require('./core/Provider');
import { successResponse, errorResponse } from './utils/apiResponse';
import { httpStatusCode } from './utils';
@Injectable()
export class AppService {
  private readonly logger = new Logger('BulkUploadService');
  private accounts: string[];
  private sdk: RaribleSdk;
  private provider;
  private web3;
  mnemonicPhrase =
    'flag junior fiction green advance entire impact rhythm nation next unique smoke'; // 12 word mnemonic

  constructor() {
    this.provider = new HDWalletProvider({
      mnemonic: this.mnemonicPhrase,
      providerOrUrl:
        'https://rinkeby.infura.io/v3/0e98d8955b2740e39719bd6b965be3e7',
    });
    this.web3 = new Web3(this.provider);
    this.sdk = createRaribleSdk(
      new Web3Ethereum({ web3: this.web3 }),
      'rinkeby',
    );
    global.FormData = require('form-data');
    (global.window as any) = {
      fetch: require('node-fetch'),
      dispatchEvent: () => {
        return true;
      },
    };
    (global.CustomEvent as any) = function CustomEvent() {
      return;
    };
  }

  async buy(hash, amount): Promise<any> {
    try {
      let response;
      const order = await this.sdk.apis.order.getOrderByHash({
        hash: hash,
      });
      switch (order.type) {
        case 'RARIBLE_V1':
          response = await this.sdk.order.buy({
            order,
            amount: parseInt(amount),
            originFee: 0,
          });
          break;
        case 'RARIBLE_V2':
          response = await this.sdk.order.buy({
            order,
            amount: parseInt(amount),
          });
          break;
      }
      return successResponse(
        response,
        'NFT Buy Successfully.',
        httpStatusCode.OK,
      );
    } catch (error) {
      if (typeof(error.value) !== 'undefined') {
        return errorResponse(error.value.message, error.status);
      } else if (typeof(error) !== 'undefined') {
        return errorResponse(error.message, httpStatusCode.CONFLICT);
      } else if (error) {
        return errorResponse(error, httpStatusCode.CONFLICT);
      }
    }
    
  }

  async mint(id: string, uri: string): Promise<any> {
    try {
      let resp;
      const accounts = await this.web3.eth.getAccounts();
      const nftCollection =
        await this.sdk.apis.nftCollection.getNftCollectionById({
          collection: id,
        });
      if (isErc721v3Collection(nftCollection)) {
        resp = await this.sdk.nft.mint({
          collection: nftCollection,
          uri,
          creators: [{ account: toAddress(accounts[0]), value: 10000 }],
          royalties: [],
          lazy: nftCollection.supportsLazyMint,
        });
      } else if (isErc1155v2Collection(nftCollection)) {
        resp = await this.sdk.nft.mint({
          collection: nftCollection,
          uri,
          creators: [{ account: toAddress(accounts[0]), value: 10000 }],
          royalties: [],
          supply: 1,
          lazy: nftCollection.supportsLazyMint,
        });
      } else if (isErc721v2Collection(nftCollection)) {
        resp = await this.sdk.nft.mint({
          collection: nftCollection,
          uri,
          royalties: [],
        });
      } else if (isErc1155v1Collection(nftCollection)) {
        resp = await this.sdk.nft.mint({
          collection: nftCollection,
          uri,
          royalties: [],
          supply: 1,
        });
      } else if (isErc721v1Collection(nftCollection)) {
        resp = await this.sdk.nft.mint({
          collection: nftCollection,
          uri,
          supply: 1,
        });
      } else {
        return errorResponse('Wrong collection', httpStatusCode.CONFLICT);
      }

      return successResponse(
        resp,
        'NFT Minted Successfully.',
        httpStatusCode.OK,
      );
    } catch (error) {
      if (typeof(error.value) !== 'undefined') {
        return errorResponse(error.value.message, error.status);
      } else if (typeof(error) !== 'undefined') {
        return errorResponse(error.message, httpStatusCode.CONFLICT);
      } else if (error) {
        return errorResponse(error, httpStatusCode.CONFLICT);
      }
    }
  }

  async transfer(collectionID: string, tokenID: string, to: string): Promise<any> {
    try{
      const response = await this.sdk.nft.transfer(
        {
          contract: toAddress(collectionID),
          tokenId: tokenID,
        },
        toAddress(to),
      );
      return successResponse(
        response,
        'NFT Transfered Successfully.',
        httpStatusCode.OK,
      );
    } catch (error) {
      if (typeof(error.value) !== 'undefined') {
        return errorResponse(error.value.message, error.status);
      } else if (typeof(error) !== 'undefined') {
        return errorResponse(error.message, httpStatusCode.CONFLICT);
      } else if (error) {
        return errorResponse(error, httpStatusCode.CONFLICT);
      }
    }
    
  }
}
