function parseEvent(txReceipt, contract, eventName) {
  const unparsedEv = txReceipt.logs.find(
    (evInfo) => evInfo.topics[0] == contract.filters[eventName]().topics[0]
  );

  const parsedEv = contract.interface.parseLog(unparsedEv);

  return parsedEv;
}

module.exports = {
  parseEvent,
};
