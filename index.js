const { calculateFee, GasPrice, coin } = require("@cosmjs/stargate");
const { DirectSecp256k1HdWallet } = require("@cosmjs/proto-signing");
const { SigningCosmWasmClient } = require("@cosmjs/cosmwasm-stargate");
const express = require('express');
const cors = require('cors');
require('dotenv').config()

const app = express();
const defaultTokenAmount = process.env.FAUCET_TOKEN_AMOUNT || "10000";
const defaultTokenDenom = process.env.FAUCET_TOKEN_DENOM || "ublu";
const port = process.env.PORT || 9090;
const sender = {
    mnemonic: process.env.FAUCET_MNEMONIC,
    address: process.env.FAUCET_ADDRESS
}
const constantData = {
    rpc: process.env.RPC,
};
const addressPrefix = process.env.FAUCET_ADDRESS_PREFIX || "blu"

async function credit(req, res) {
    const { denom, address } = req.query;
    if (denom != defaultTokenDenom) {
        return res.json({
            status: "Denom mismatch"
        })
    }

    const gasPrice = GasPrice.fromString("0.05" + defaultTokenDenom);
    const execFee = calculateFee(500000, gasPrice);
    const sender_wallet = await DirectSecp256k1HdWallet.fromMnemonic(sender.mnemonic, { prefix: addressPrefix });
    const client = await SigningCosmWasmClient.connectWithSigner(constantData.rpc, sender_wallet);

    const r = await client.sendTokens(sender.address, address, [coin(defaultTokenAmount, defaultTokenDenom)], execFee);
    return res.json(r)
}

async function getStatus(_req, res) {
    return res.json('ok')
}

app.post('/credit', credit);
app.get('/status', getStatus);
app.use(cors({
    origin: "*",
    optionsSuccessStatus: 200
}))
app.listen(port, () => {
    // console.log('Faucet api is listening on port 4000.')
});