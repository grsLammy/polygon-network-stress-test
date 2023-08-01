import dotenv from 'dotenv';
import {getNamedAccounts} from 'hardhat';
import {HardhatRuntimeEnvironment} from 'hardhat/types';
import {DeployFunction} from 'hardhat-deploy/dist/types';
dotenv.config();

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  const {deployments} = hre;
  const {deploy} = deployments;
  const {deployer} = await getNamedAccounts();

  await deploy('TestERC721', {
    from: deployer,
    args: [],
    log: true,
    skipIfAlreadyDeployed: true,
    contract: 'TestERC721',
  });
};

func.tags = ['TestERC721'];

export default func;
