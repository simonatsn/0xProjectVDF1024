import {waffle} from '@nomiclabs/buidler';
import chai from 'chai';
import {deployContract, solidity} from 'ethereum-waffle';
import {utils, ethers} from 'ethers';

import VerifierTestingArtifact from '../artifacts/VerifierTesting.json';
import {VerifierTesting} from '../typechain/VerifierTesting';

chai.use(solidity);
const {expect} = chai;

describe('Verifier Testing', () => {
    let verifier: any;
    const init_hex = '0x0123456789abcded';

    const provider = waffle.provider;
    const [wallet] = provider.getWallets();

    before(async () => {
        verifier = (await deployContract(
            wallet,
            VerifierTestingArtifact,
        )) as VerifierTesting;
    });

    it('Should add big numbs correctly', async () => {
        // This first test is basic but uses both parts of the function.
        const c = await verifier.big_add_external(
            '0x00ffffff6c9b26d064d9364d9364d9364d9364d9364d9364d9364d9364d9364e',
            '0x00ffffff6c9b26d064d9364d9364d9364d9364d9364d9364d9364d9364d9364e',
        );
        expect(c).to.be.eq(
            '0x01fffffed9364da0c9b26c9b26c9b26c9b26c9b26c9b26c9b26c9b26c9b26c9c'.toLocaleLowerCase(),
        );
        // We will randomly sample much larger numbs for more cases
        for (let i = 0; i < 10; i++) {
            // 256 bytes is the target big numb rsa size
            const a = utils.randomBytes(256);
            const b = utils.randomBytes(256);
            verifier.big_add_external(a, b).then((c: any) => {
                expect(c).to.be.eq(
                    utils
                        .bigNumberify(a)
                        .add(utils.bigNumberify(b))
                        .toHexString(),
                );
            });
        }
    });

    it('Should sub big numbs correctly', async () => {
        // This first test is basic but uses both parts of the function.
        const c = await verifier.big_sub_external(
            '0x9185cf46bc8ef7d6a2906b5db87c43611f40bc47bccd14d5606d89b5e35ca620',
            '0x8e819e9b4fcaf230255c4273059121d96e45da765348d66fabbb3fa0304a68dd',
        );
        expect(c).to.be.eq(
            '0x030430ab6cc405a67d3428eab2eb2187b0fae1d169843e65b4b24a15b3123d43'.toLocaleLowerCase(),
        );
        // We will randomly sample much larger numbs for more cases
        for (let i = 0; i < 10; i++) {
            // 256 bytes is the target big numb rsa size
            let a = utils.randomBytes(32);
            let b = utils.randomBytes(32);
            // We don't want underflow reverts
            if (utils.bigNumberify(a).lt(utils.bigNumberify(b))) {
                [a, b] = [b, a];
            }
            verifier.big_sub_external(a, b).then((c: any) => {
                expect(c).to.be.eq(
                    utils
                        .bigNumberify(a)
                        .sub(utils.bigNumberify(b))
                        .toHexString(),
                );
            });
        }
    });

    it('Should validate a correct hash to prime', async () => {
        await verifier.check_hash_to_prime(
            '0x8885ad4896cc9a32a4bdf1fac0a4b2d6e7e110714dbdcf04ec1bbd417c2a9d55',
            '0x467f2197715ac2f535f20c5650a8c509537dfbdc689742757d42cd9bea4d11ee79c189e25b232959086eabe2c9c364de05f983098ed1f40e923c65a04d2f08724fb7960b0b79f01998cf7b45afbb58dde39d252df31748e5f463bced9d485065af04611e74be206a347004542ede394c7aba8be2be434d41623aaeff8b9353dd',
            '0xf5efe1505a43025e0520b7d0acc71b4448a7670303',
        );
    });

    it('Should validate a correct proof', async () => {
        const result = await (await verifier.verify_vdf_proof_gas(
            // input random / g
            '0x8885ad4896cc9a32a4bdf1fac0a4b2d6e7e110714dbdcf04ec1bbd417c2a9d55',
            // y
            '0x467f2197715ac2f535f20c5650a8c509537dfbdc689742757d42cd9bea4d11ee79c189e25b232959086eabe2c9c364de05f983098ed1f40e923c65a04d2f08724fb7960b0b79f01998cf7b45afbb58dde39d252df31748e5f463bced9d485065af04611e74be206a347004542ede394c7aba8be2be434d41623aaeff8b9353dd',
            // pi
            '0x59a5c5c6f0cad5d82069519514fd71c9befeb92efcce7ae7764796f4d8087f62a5295f31022c9fb9fba00472f1b86f5cad99838dbb0c93d7cc6f044ac0797622b0afafabf33d58e8eadb9b33881338e062b377c5a25ea9accf555570e366599617e8510b5d4db4c8b423784738727642ed0a322eb6a5c2a001c3222710fed4e9',
            // iterations / t
            433932696,
            // prime / l
            '0xf5efe1505a43025e0520b7d0acc71b4448a7670303',
        )).wait();
        console.log("The verifier took this much gas:");
        console.log(result.gasUsed.toNumber());
    });
});
