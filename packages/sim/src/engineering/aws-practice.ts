import type { World } from '../world';
import { runningConf } from '../hosts/running';
import { resolveHost, splunkdRunning } from '../hosts/profile';
import { setting } from '../conf/merge';
import { confBool } from '../conf/parse';
import { ingestText } from './ingestion';
import { OperationsError } from './access';
import {
  INTEGRATION_PATHS,
  readIntegrationSource,
  parseTeachingJson,
  integrationReceipt,
  persistIntegrations,
} from './integration-state';
export const AWS_QUEUE = 'https://sqs.us-east-1.amazonaws.com/000000000000/v7-practice';
export const AWS_BUCKET = 'sandbox-v7-vpcflow';
export const AWS_INPUT_SOURCE =
  '[aws_sqs_based_s3://v7_vpcflow]\naws_account=training_account\nsqs_queue_url=' +
  AWS_QUEUE +
  '\nsqs_queue_region=us-east-1\nsqs_batch_size=10\ns3_file_decoder=CloudWatchLogs\ninterval=60\nindex=cloud_logs\nsourcetype=aws:cloudwatchlogs:vpcflow\ndisabled=0\n';
export const AWS_QUEUE_ARN = 'arn:aws:sqs:us-east-1:000000000000:v7-practice';
export const AWS_OBJECT_ARN = 'arn:aws:s3:::' + AWS_BUCKET + '/';
export const AWS_POLICY_SOURCE =
  JSON.stringify(
    {
      Version: '2012-10-17',
      Statement: [
        {
          Sid: 'ReceivePracticeNotifications',
          Effect: 'Allow',
          Action: ['sqs:ReceiveMessage', 'sqs:DeleteMessage'],
          Resource: AWS_QUEUE_ARN,
        },
        {
          Sid: 'ReadPracticeObjects',
          Effect: 'Allow',
          Action: 's3:GetObject',
          Resource: AWS_OBJECT_ARN + '*',
        },
      ],
    },
    null,
    2,
  ) + '\n';
export const VPC_PROPS =
  '[aws:cloudwatchlogs:vpcflow]\nEXTRACT-vpc = ^(?<version>\\d+)\\s+(?<account_id>\\S+)\\s+(?<interface_id>\\S+)\\s+(?<srcaddr>\\S+)\\s+(?<dstaddr>\\S+)\\s+(?<srcport>\\d+)\\s+(?<dstport>\\d+)\\s+(?<protocol>\\d+)\\s+(?<packets>\\d+)\\s+(?<bytes>\\d+)\\s+(?<start>\\d+)\\s+(?<end>\\d+)\\s+(?<action>\\S+)\\s+(?<log_status>\\S+)\n';
export function validateAwsPolicy(source: string) {
  const p = parseTeachingJson(source, ['Version', 'Statement'], 'IAM policy');
  if (
    p.Version !== '2012-10-17' ||
    !Array.isArray(p.Statement) ||
    p.Statement.length < 1 ||
    p.Statement.length > 20
  )
    throw new OperationsError('Use a bounded native IAM Version/Statement policy');
  const statements = p.Statement.map((value) => {
    if (
      !value ||
      typeof value !== 'object' ||
      Array.isArray(value) ||
      Object.keys(value).some((k) => !['Sid', 'Effect', 'Action', 'Resource'].includes(k))
    )
      throw new OperationsError('This IAM adapter supports Sid, Effect, Action and Resource');
    const st = value as Record<string, unknown>,
      actions = Array.isArray(st.Action) ? st.Action : [st.Action],
      resources = Array.isArray(st.Resource) ? st.Resource : [st.Resource];
    if (
      !['Allow', 'Deny'].includes(String(st.Effect)) ||
      actions.length < 1 ||
      actions.length > 3 ||
      actions.some((v) => !['sqs:ReceiveMessage', 'sqs:DeleteMessage', 's3:GetObject'].includes(String(v))) ||
      resources.length < 1 ||
      resources.length > 4 ||
      resources.some(
        (v) =>
          typeof v !== 'string' ||
          v.length > 300 ||
          (v.match(/\*/g)?.length ?? 0) > 3 ||
          (v !== AWS_QUEUE_ARN && !v.startsWith(AWS_OBJECT_ARN)),
      )
    )
      throw new OperationsError(
        'Use native allow/deny statements scoped to the supplied fictional SQS/S3 resources',
      );
    return { effect: st.Effect, actions: actions as string[], resources: resources as string[] };
  });
  return (permission: string, resource: string) => {
    const matching = statements.filter(
      (s) =>
        s.actions.includes(permission) &&
        s.resources.some((r) =>
          new RegExp(
            '^' +
              r
                .split('*')
                .map((part) => part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
                .join('.*') +
              '$',
          ).test(resource),
        ),
    );
    return matching.some((s) => s.effect === 'Allow') && !matching.some((s) => s.effect === 'Deny');
  };
}
export function pollAws(w: World, force = false) {
  const a = w.integrations?.aws;
  if (!a) throw new OperationsError('AWS practice is not initialized');
  const p = resolveHost(w, a.host)!,
    conf = runningConf(w, p, 'inputs'),
    name = 'aws_sqs_based_s3://v7_vpcflow',
    get = (key: string) => setting(conf, name, key) ?? '',
    interval = Number(get('interval') || '60');
  if (!force && a.lastPoll !== undefined && w.clock.now - a.lastPoll < Math.max(10, interval) * 1000) return;
  a.lastPoll = w.clock.now;
  try {
    if (!splunkdRunning(w, p)) throw new OperationsError('AWS modular-input host service is stopped');
    if (!conf.stanzas.has(name) || confBool(get('disabled')))
      throw new OperationsError('Activate the enabled native AWS SQS-based S3 input');
    if (!Number.isInteger(interval) || interval < 10 || interval > 3600)
      throw new OperationsError('Practice polling interval must be 10–3600 seconds');
    if (get('aws_account') !== 'training_account')
      throw new OperationsError('Fictional AWS account alias is unavailable');
    if (get('sqs_queue_url') !== AWS_QUEUE || get('sqs_queue_region') !== 'us-east-1')
      throw new OperationsError('Native queue URL/region do not match the fictional notification queue');
    if (get('s3_file_decoder') !== 'CloudWatchLogs')
      throw new OperationsError('Use the CloudWatchLogs object decoder for this fixture');
    const allow = validateAwsPolicy(readIntegrationSource(w, a.host, INTEGRATION_PATHS.awsPolicy));
    for (const permission of ['sqs:ReceiveMessage', 'sqs:DeleteMessage'])
      if (!allow(permission, permission.startsWith('sqs:') ? AWS_QUEUE_ARN : AWS_OBJECT_ARN + 'flows/a.json'))
        throw new OperationsError(
          'Fictional IAM policy denies ' + permission + '; notifications and object checkpoints are retained',
        );
    const size = Number(get('sqs_batch_size') || '10');
    if (!Number.isInteger(size) || size < 1 || size > 10)
      throw new OperationsError('SQS practice batch size: 1–10');
    const messages = a.messages.filter((m) => !m.acknowledged).slice(0, size);
    if (!messages.length) {
      integrationReceipt(w, 'aws', 'queue', 'empty');
      return;
    }
    for (const m of messages) {
      const key = [m.bucket, m.key, m.version].join('|');
      if (a.processed.includes(key)) {
        m.acknowledged = true;
        integrationReceipt(w, 'aws', m.id, 'duplicate');
        continue;
      }
      const obj = a.objects.find((o) => o.bucket === m.bucket && o.key === m.key && o.version === m.version);
      if (!obj) throw new OperationsError('S3 notification refers to a missing object version');
      if (!allow('s3:GetObject', 'arn:aws:s3:::' + obj.bucket + '/' + obj.key))
        throw new OperationsError('Fictional IAM policy denies s3:GetObject for ' + obj.key);
      let body: { logEvents?: { message?: unknown }[] };
      try {
        body = JSON.parse(obj.raw) as typeof body;
      } catch {
        throw new OperationsError('Malformed CloudWatchLogs object JSON');
      }
      if (
        !body ||
        !Array.isArray(body.logEvents) ||
        !body.logEvents.length ||
        body.logEvents.length > 100 ||
        body.logEvents.some(
          (e) => !e || typeof e.message !== 'string' || e.message.length > 65536 || /[\r\n]/.test(e.message),
        )
      )
        throw new OperationsError('Use up to 100 explicit CloudWatch logEvents messages');
      const records = ingestText(
        w,
        a.host,
        's3://' + obj.bucket + '/' + obj.key,
        get('sourcetype'),
        get('index'),
        body.logEvents.map((e) => e.message).join('\n') + '\n',
      );
      a.processed.push(key);
      m.acknowledged = true;
      integrationReceipt(
        w,
        'aws',
        m.id,
        'delivered',
        records.map((r) => r.id),
      );
    }
  } catch (e) {
    integrationReceipt(w, 'aws', 'queue', 'failed', [], (e as Error).message);
  }
  persistIntegrations(w);
}
