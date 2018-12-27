const asyncAuto = require('async/auto');

const {ddb} = require('./../dynamodb');
const {chainId} = require('./../chains');
const {chansDb} = require('./constants');
const {returnResult} = require('./../async');
const {updateDdbItem} = require('./../dynamodb');

/** Update channel extra metadata

  {
    [alias]: <Alias String>
    aws_access_key_id: <AWS Access Key Id String>
    aws_dynamodb_table_prefix: <AWS DynamoDb Table Name Prefix String>
    aws_secret_access_key: <AWS Secret Access Key String>
    [color]: <Color String>
    id: <Channel Id Hex String>
    index: <Edge Index Number>
    network: <Network Name String>
    public_key: <Public Key Hex String>
  }
*/
module.exports = (args, cbk) => {
  return asyncAuto({
    // Check arguments
    validate: cbk => {
      if (args.alias === undefined && !args.color) {
        return cbk([400, 'ExpectedNodeAliasOrColorForChannelMetadataUpdate']);
      }

      if (!args.aws_access_key_id) {
        return cbk([400, 'ExpectedAwsAccessKeyidToUpdateChannelMetadata']);
      }

      if (!args.aws_dynamodb_table_prefix) {
        return cbk([400, 'ExpectedAwsTablePrefixToUpdateChannelMetadata']);
      }

      if (!args.aws_secret_access_key) {
        return cbk([400, 'ExpectedAwsSecretAccessKeyToUpdateChannelMetadata']);
      }

      if (!args.id) {
        return cbk([400, 'ExpectedChannelIdForMetadataUpdate']);
      }

      if (args.index !== 0 && args.index !== 1) {
        return cbk([400, 'ExpectedEdgeIndexForMetadataUpdate']);
      }

      if (!args.network) {
        return cbk([400, 'ExpectedNetworkForChannelMetadataUpdate']);
      }

      return cbk();
    },

    // Chain id
    chain: ['validate', ({}, cbk) => {
      try {
        return cbk(null, chainId({network: args.network}).chain_id);
      } catch (err) {
        return cbk([400, 'ExpectedKnownNetworkForMetadataUpdate']);
      }
    }],

    // Db
    db: ['validate', ({}, cbk) => {
      try {
        return cbk(null, ddb({
          access_key_id: args.aws_access_key_id,
          secret_access_key: args.aws_secret_access_key,
        }));
      } catch (err) {
        return cbk([500, 'FailedToGetDdbConnectionForMetadataUpdate', err]);
      }
    }],

    // Update the channel metadata
    update: ['chain', 'db', ({chain, db}, cbk) => {
      const changes = {};
      const key = `${chain}${args.id}`;
      const n = args.index + [args.id].length;
      const table = `${args.aws_dynamodb_table_prefix}-${chansDb}`;

      if (!!args.alias) {
        changes[`node${n}_alias`] = {set: args.alias};
      }

      if (args.alias === '') {
        changes[`node${n}_alias`] = {remove: args.alias};
      }

      if (!!args.color) {
        changes[`node${n}_color`] = {set: args.color};
      }

      changes[`node${n}_metadata_update`] = {set: new Date().toISOString()};
      changes[`node${n}_public_key`] = {set: args.public_key};

      return updateDdbItem({db, changes, table, where: {key}}, cbk);
    }],
  },
  returnResult({}, cbk));
};

