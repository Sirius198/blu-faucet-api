const { calculateFee, GasPrice, coin } = require("@cosmjs/stargate");
const { DirectSecp256k1HdWallet } = require("@cosmjs/proto-signing");
const { SigningCosmWasmClient } = require("@cosmjs/cosmwasm-stargate");
const express = require('express');
const cors = require('cors');
require('dotenv').config()

const app = express();

// const allowedOrigins = ['https://faucet.bluwallet.app'];
// app.use(cors({
//     origin: 'https://faucet.bluwallet.app',
//     optionsSuccessStatus: 200
// }));
app.use(cors());
app.use(express.json());

// Default Params
const defaultTokenAmount = process.env.FAUCET_TOKEN_AMOUNT || "10000";
const defaultTokenDenom = process.env.FAUCET_TOKEN_DENOM || "ublu";
const port = process.env.PORT || 4000;
const sender = {
    mnemonic: process.env.FAUCET_MNEMONIC,
    address: process.env.FAUCET_ADDRESS
}
const constantData = {
    rpc: process.env.RPC,
    cooldownTime: 3600 * 4,
};
const addressPrefix = process.env.FAUCET_ADDRESS_PREFIX || "blu"

// Address counter
let addressCounter = new Map();

async function credit(req, res) {
    const { denom, address } = req.body;
    if (denom != defaultTokenDenom) {
        return res.json({
            status: "Denom mismatch"
        })
    }

    // Check cooldown
    const entry = addressCounter.get(address);
    if (entry !== undefined) {
        const cooldownTimeMs = constantData.cooldownTime * 1000;
        if (entry.getTime() + cooldownTimeMs > Date.now()) {
            return res.json("cooldown error");
        }
    }

    const gasPrice = GasPrice.fromString("0.05" + defaultTokenDenom);
    const execFee = calculateFee(500000, gasPrice);
    const sender_wallet = await DirectSecp256k1HdWallet.fromMnemonic(sender.mnemonic, { prefix: addressPrefix });
    const client = await SigningCosmWasmClient.connectWithSigner(constantData.rpc, sender_wallet);

    try {
        const _ = await client.sendTokens(sender.address, address, [coin(defaultTokenAmount, defaultTokenDenom)], execFee);
        addressCounter.set(address, new Date());
    } catch (error) {
        return res.json("error");
    }
    return res.json('ok');
}

async function getStatus(_req, res) {
    return res.json({
        status: 'ok'
    })
}

app.post('/credit', credit);
app.get('/status', getStatus);
app.listen(port, () => {
    // console.log('Faucet api is listening on port 4000.')
});