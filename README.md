## Before starting

Need to make a .env file at the top level with

```bash
REPORT_GAS = true;
COINMARKETCAP_API_KEY = the api obtain from coinmarket to calculate gas fee
PRIVATE_KEY = the private key of metamask account 
ETHERSCAN_API = the private key on etherscan, to be used for contract verification after deployed 
INFURA_ID = id of infura node
INFURA_SECRET = secret of infura node
INFURA_URL = 
GNOSIS_SAFE_ADDR_RINKEBY = safe address to be the onwer of contract after deployed
DEFENDER_TEAM_API_KEY = defender api key for contract upgrade 
DEFENDER_TEAM_API_SECRET_KEY =
```

#Calculate cost manually:

real cost = transaction cost * price on eth station, then convert the result in gwei to eth

  Where:

    + transaction cost = cost of transaction ~ shown on the picture below, or on remix

    + price on eth station = fluctuate during the day, obtain at https://ethgasstation.info/

    + converting gwei to eth at: https://nomics.com/markets/gwei-gwei/eth-ethereum


## Execute command to start the test.
```bash
npx hardhat test
```


## Execute command to get test coverage.
```bash
npx hardhat coverage --testfiles "test/******.test.js"
```

Test coverage are generated within ./coverage folder. Opening index.html will indicate which part of the test have not covered.


## Steps to Deploy

1. Compile the contract
    ```
    npx hardhat compile
    ```
2. Edit the deploy script.

    Modify `scripts/deploy.js` to include the specific deploy arguments that you want your ERC721 contract to be deployed with.
3. Deploy the contract
    ```
    npx hardhat run scripts/deploy.js --network rinkeby
    ```
