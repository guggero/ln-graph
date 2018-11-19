const asyncRetry = require('async/retry');

const registerNodeUpdate = require('./register_node_update');

const retryInterval = retryCount => 50 * Math.pow(2, retryCount);
const retryTimes = 15;

/** Record a node update to the database

  {
    alias: <Alias String>
    aws_access_key_id: <AWS Access Key Id String>
    aws_dynamodb_table_prefix: <AWS DynamoDb Table Name Prefix String>
    aws_secret_access_key: <AWS Secret Access Key String>
    network: <Network Name String>
    public_key: <Node Public Key Hex String>
    [sockets]: [<Socket String>]
    updated_at: <ISO 8601 Date String>
  }

  {
    [rev]: <Node Updated Revision Number>
  }
*/
module.exports = (args, cbk) => {
  return asyncRetry(
    {
      interval: retryInterval,
      times: retryTimes,
    },
    cbk => {
      return registerNodeUpdate({
        alias: args.alias,
        aws_dynamodb_table_prefix: args.aws_dynamodb_table_prefix,
        aws_access_key_id: args.aws_access_key_id,
        aws_secret_access_key: args.aws_secret_access_key,
        network: args.network,
        public_key: args.public_key,
        sockets: args.sockets,
        updated_at: args.updated_at,
      },
      cbk);
    },
    cbk
  );
};

