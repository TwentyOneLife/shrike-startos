// Regression test for the config the package writes into the wallet's own settings file.
//
// Two defects it exists to catch, both found on 2026-09-24 and both invisible to a typecheck:
//
//   1. The server was written to `.shrike/config` whatever network was selected. Shrike keeps one
//      config per network, so a testnet4 wallet read a file nobody had touched and fell back to its
//      own defaults.
//   2. The fix for (1) then had to merge into a file the wallet itself had written. Shrike serialises
//      with Gson, which omits null fields, so that file can be missing keys our shape declares. With
//      `proxyServer` required, `merge` validated the merged object, threw, and would have taken
//      startup down on testnet4. That is a worse failure than the bug being fixed.
//
// The fixture is a real wallet-authored config from the test node with the addresses and credentials
// removed. Its value is precisely the keys it does not have.
//
// Run: npm test

import { test } from 'node:test'
import assert from 'node:assert/strict'
import * as fs from 'node:fs'
import * as os from 'node:os'
import * as path from 'node:path'
import { shrikeConfig } from '../startos/fileModels/shrike.json'

// Bundled with the package's own ncc before running, because every import in this codebase is
// extensionless and node's type stripping will not resolve those. Bundling means no import.meta, so
// the fixture is found relative to the repo root the test is run from.
const FIXTURE = path.join(
  process.cwd(),
  'test/fixtures/wallet-authored-config.json',
)
const SERVER = 'tcp://electrum.example:50011'

type Network = 'mainnet' | 'testnet4'

// `merge` reaches only for `effects.constRetry`, so a bare object drives it. The cast is the honest
// shape of that: nothing else on Effects is touched, and pretending otherwise would mean stubbing
// forty methods to prove one merge.
const effects = {} as unknown as Parameters<
  ReturnType<typeof shrikeConfig>['merge']
>[0]

/** A scratch copy of the fixture at the path this network's config lives at. */
function stage(network: Network) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'shrike-config-'))
  const sub =
    network === 'mainnet' ? '.shrike/config' : `.shrike/${network}/config`
  const file = path.join(dir, sub)
  fs.mkdirSync(path.dirname(file), { recursive: true })
  fs.copyFileSync(FIXTURE, file)
  return { dir, file }
}

for (const network of ['mainnet', 'testnet4'] as Network[]) {
  test(`${network}: the server is written into the file that network reads`, async () => {
    const { dir, file } = stage(network)
    try {
      const before = JSON.parse(fs.readFileSync(file, 'utf-8'))
      assert.equal(
        before.serverType,
        'BITCOIN_CORE',
        'fixture should start unconfigured',
      )
      assert.ok(
        !('proxyServer' in before),
        'fixture must lack proxyServer; that is the point',
      )

      const helper = shrikeConfig(network).withPath(file)
      await helper.merge(effects, {
        serverType: 'ELECTRUM_SERVER',
        electrumServer: SERVER,
        useProxy: false,
      })

      const after = JSON.parse(fs.readFileSync(file, 'utf-8'))
      assert.equal(after.serverType, 'ELECTRUM_SERVER')
      assert.equal(after.electrumServer, SERVER)
      assert.equal(after.useProxy, false)

      // Everything the wallet had set must survive. If this fails the package is quietly reverting
      // the user's settings on every start, including the ones that keep it from reaching the
      // network: `blockExplorer` and `exchangeSource`.
      const lost = Object.keys(before).filter((k) => !(k in after))
      assert.deepEqual(
        lost,
        [],
        `merge dropped keys the wallet had set: ${lost.join(', ')}`,
      )
    } finally {
      fs.rmSync(dir, { recursive: true, force: true })
    }
  })
}

test('the two networks resolve to different files', () => {
  const m = shrikeConfig('mainnet')
  const t = shrikeConfig('testnet4')
  assert.notEqual(m.path, t.path)
  assert.ok(String(t.path).includes('testnet4'), `testnet4 path was ${t.path}`)
})
