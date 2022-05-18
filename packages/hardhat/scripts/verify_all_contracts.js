const { chainIdToName } = require("../scripts/utils");
const {
  deployments,
  getNamedAccounts,
  run,
  ethers,
  getChainId,
  artifacts,
} = require("hardhat");
var path = require("path"),
  fs = require("fs");

async function verifyAllContracts() {
  const chainId = await getChainId();
  const networkName = chainIdToName(chainId).toLowerCase();

  startPath = path.join(__dirname, "../deployments", networkName);
  console.log(startPath);
  if (!fs.existsSync(startPath)) {
    console.log("no dir ", startPath);
    return;
  }

  var artifactName, rawdata, parsedData, address, args;
  var files = fs.readdirSync(startPath);
  for (var i = 0; i < files.length; i++) {
    var filename = path.join(startPath, files[i]);
    var stat = fs.lstatSync(filename);
    if (!stat.isDirectory() && files[i].endsWith(".json")) {
      console.log("-- found: ", filename);
      artifactName = files[i].replace(".json", "");
      rawdata = fs.readFileSync(filename);
      parsedData = JSON.parse(rawdata);
      address = parsedData.address;
      args = parsedData.args;
      console.log("artifactName: ", artifactName);
      console.log("address: ", address);
      console.log("args: ", args);
      await verifyContract(address, artifactName, undefined, args);
    }
  }
}

async function verifyContract(
  address,
  artifactName,
  libraries,
  constructorArguments
) {
  const artifact = await artifacts.readArtifact(artifactName);
  const fullyQualifiedName = `${artifact.sourceName}:${artifact.contractName}`;
  console.log("Contract verification start");
  try {
    await run("verify:verify", {
      contract: fullyQualifiedName,
      address,
      constructorArguments,
      libraries,
    });
    console.log(`Contract ${artifactName} successfully verified`);
  } catch (error) {
    console.warn("\n !!! Contract not verified");
    console.error(`Error: ${error.message}\n`);
  }
}

verifyAllContracts()
.then(() => process.exit(0))
.catch((error) => {
  console.error(error);
  process.exit(1);
});