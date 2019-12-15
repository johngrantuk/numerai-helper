
## Numerai Helper

Erasure is a smart contract protocol that brings simple web3 primitives to any website on the internet. When posting a file to Erasure, a hash of the file is sent to Ethereum and an encrypted version of the file is sent to IPFS. The hash builds reputation by proving you had the file at a given point in time. The encrypted file allows you to retrieve the file when a buyer shows interest.

Many traditional web developers may not be experienced in dealing with how the data should be used with Erasure or how to store the data in a decentralised manner or even how to encrypt or hash their data. This Javascript helper library speeds of app development by abstracting away these complexities and allows the user to simply provide their raw data and select a storage method (IPFS or 3Box for now). The library handles encryption and storage and provides the various proof hashes and storage information the user requires.

See post for more detail.

## To Use

To start simply copy the numerai-helper.js file to your app, import and create new helper with your desired app name (will be used for 3Box storage space) and eth address.

Packages required: 3Box, @erasure/crypto-ipfs, @pinata/sdk, axios.

```javascript
import NumeraiHelper from "./numerai-helper";

var helper = new NumeraiHelper('numerai', 'post_creator_eth_address');
```

### `savePost`

Creates required Post data from RawData and stores encrypted data and proof JSON using selected storage method.

##### `NumeraiHelper.savePost()`
##### Params
* `RawData` - Raw data from creator.
* `StorageMethod` - 3Box or IPFS via Pinata.
* `PinataApiKey` - Only for IPFS.
* `PinataApiSecret` - Only for IPFS.

##### Response
```
{
 proofJson: {
   creator: this.ethAddress,                      // Post creator address.
   salt: ErasureHelper.crypto.asymmetric.generateNonce(),
   datahash: dataHash,                            // Hash of the raw data - used for confirmation
   encryptedDatahash: encryptedDataHash,         // This allows the encrypted data to be located on IPFS or 3Box
   keyhash: symmetricKeyHash                      // Hash of symmetricKey used for encryption - used for confirmation
 }
 proofhash: proofHash58,                          // Hash of proofJson - should be saved on chain
 symmetricKey: symmetricKey,                      // SymmetricKey used for encryption. For post creator to store.
 encryptedData: encryptedFile                     // Encrypted data - used for storage.
};
```
##### Example Code
```javascript
componentDidMount = async () => {
  var helper = new NumeraiHelper('numerai', '0xEefc64D684A2dE1566b9A3368150cC882aA0B683');

  var postData = await helper.savePost('test create post', '3Box');
  console.log('App postData: ')
  console.log(postData)
}
```



 /**
  * Retrieves encrypted data from selected storage method, decrypts and checks against hash.
  * @param {string} JsonHash Hash of proofJson - normally retrieved from On-Chain.
  * @param {string} SymmetricKey SymmetricKey used to decrypt data.
  * @param {string} StorageMethod 3Box or IPFS via Pinata. (Others can be added).
  * @return {object} { rawData: rawMessage, hashCheck: hashCheck }
  */
 NumeraiHelper.prototype.retrievePost


## To Do

* Make an npm module.

* Add Smart Contract functions:

It took me a while to get my head around the data requirements for interacting with Erasure (hence this library) but I can see how the work completed so far could naturally be built upon by adding the smart contract functionality, see examples below.

Buying/Reveal:
* Get EncSymKey from Griefing contract.
* Decrypt SymKey
* Confirm SymKey hash is correct. -- DONE
* Get Encrypted data from storage.-- DONE
* Decrypt data.                   -- DONE
* Confirm data hash.              -- DONE

Add Selling Flow:
* Seller create Post to sell -- DONE
* Encrypt SymKey with BuyerPubKey
* Submit EncSymKey to Griefing contract.
