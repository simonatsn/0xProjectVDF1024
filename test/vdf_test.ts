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
            '0xd0f77ab74cee14398801dea5ee3ef742ed1571f5a94b5616e9452ad5fbdcc356',
            // y
            '0x5d25709454a667c7c6c6cc4f3c693f0d73996fc735da7454266beba5fb933591f61ab38dd0acb0f95e7b766903540e20018244b2e348110d90323893b3a501541696d842e91c2e195f65309279c1a983804437e3966b8ab138c4086e75e01fc7e54b754f5de78b3127d5285a79dab6d855c725a54aa5ae88ec73f128613c9688',
            // pi
            '0xaeb2ca26379c74e101177c8028f5f3329ab90a3aca6c2ed3adc97e8f99c54984336af2c63efffcc31708bebfe2d14b09655998129c1046b52f0a12cf6686d12db697e27b3ba4f219aa382c1845d9b5975541eec8e618dc0c63ade903a572b5f95e90b65dd43410e61a275c067cc079ab0e1995d325b0bc75022d98b7970fd72',
            // iterations / t
            68719476736,
            // prime / l
            '0xd04ce8a20373bc7dfd90735a047a24dfc19d9afce3',

        )).wait();
        console.log("The verifier took this much gas:");
        console.log(result.gasUsed.toNumber());
    });
});
