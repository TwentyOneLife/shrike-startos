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
// What these do not cover: whether main.ts sends this payload, and sends it unconditionally. That
// needs a running package, so it is verified on the node rather than here. Do not read a green run
// as proof the package is configured correctly.
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

// What main.ts asserts on every start, whatever the network. These are the settings that decide
// whether the wallet talks to anyone but its own server; the fixture carries Sparrow's stock values
// for them, which do reach out.
const PRIVACY = {
  blockExplorer: 'http://none',
  feeRatesSource: 'ELECTRUM_SERVER',
  exchangeSource: 'NONE',
  checkNewVersions: false,
  useProxy: false,
} as const

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
        ...PRIVACY,
        serverType: 'ELECTRUM_SERVER',
        electrumServer: SERVER,
      })

      const after = JSON.parse(fs.readFileSync(file, 'utf-8'))
      assert.equal(after.serverType, 'ELECTRUM_SERVER')
      assert.equal(after.electrumServer, SERVER)
      for (const [k, v] of Object.entries(PRIVACY)) {
        assert.equal(after[k], v, `${k} was not asserted on ${network}`)
      }

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
  // This is the only guard on the path, because the tests above override it with withPath and the
  // install that would really exercise it does not run in CI. Assert the whole ending, not that the
  // word appears somewhere in it.
  assert.ok(
    String(m.path).endsWith('.shrike/config'),
    `mainnet path was ${m.path}`,
  )
  assert.ok(
    String(t.path).endsWith('.shrike/testnet4/config'),
    `testnet4 path was ${t.path}`,
  )
  assert.notEqual(m.path, t.path)
})

test('a network with no server still gets the settings that keep it quiet', async () => {
  // Testnet4 with no address configured. The wallet has nowhere to connect, which is expected and
  // stated in the interface; what must not happen is that it spends that time fetching fee rates
  // from a public mempool site because the defaults never reached this file.
  const { dir, file } = stage('testnet4')
  try {
    const before = JSON.parse(fs.readFileSync(file, 'utf-8'))
    assert.equal(before.blockExplorer, 'https://mempool.guide')
    assert.equal(before.feeRatesSource, 'MEMPOOL_GUIDE')
    assert.equal(before.checkNewVersions, true)

    await shrikeConfig('testnet4').withPath(file).merge(effects, PRIVACY)

    const after = JSON.parse(fs.readFileSync(file, 'utf-8'))
    for (const [k, v] of Object.entries(PRIVACY)) {
      assert.equal(after[k], v, `${k} was not asserted without a server`)
    }
    // Its own server setting is left alone rather than replaced with an empty one.
    assert.equal(after.serverType, before.serverType)
    assert.ok(
      !('electrumServer' in after),
      'no server should have been invented',
    )
  } finally {
    fs.rmSync(dir, { recursive: true, force: true })
  }
})
