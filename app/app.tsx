'use client'

import { WalletConnectReact, useReactWalletStore } from 'n20-connect/dist/react'

import 'n20-connect/dist/style/index.css'
import { useTheme } from 'next-themes'
import ReactSelect from 'react-select'
import { useTranslation } from 'react-i18next'

import N20Wallet from './n20-wallet'
import { interpolate } from './n20-wallet/n20_utils'

let n20_wallet: N20Wallet | undefined = undefined
let n20_sch: string | undefined = undefined

type Option = string | number
type Options = { [key in Option]: any }

function Contracts(wallet?: N20Wallet, onChange?: (Options) => void) {
  if (wallet !== undefined) {
    const contract_list: Options[] = [{ label: '', value: '' }]
    wallet.getContracts().then((res) => {
      res.map((contract, index) =>
        contract_list.push({
          label: contract.scname + '\t[' + contract.txtime + ']',
          value: contract.hash,
        })
      )
    })
    if (contract_list) {
      return (
        <ReactSelect
          className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:border-blue-500 dark:focus:ring-blue-500"
          options={contract_list}
          onChange={onChange}
        />
      )
    } else {
      return <div>No N20 Token found in this wallet.</div>
    }
  } else {
    return <div>Unavailable wallet.</div>
  }
}

function App() {
  const { resolvedTheme } = useTheme()
  const ext_wallet = useReactWalletStore((state) => state)
  const { t } = useTranslation()

  const onConnectSuccess = async (wallet: any) => {
    if (wallet === undefined) {
      alert('N20 wallet not initailized' + wallet.publicKey)
    }
    n20_wallet = new N20Wallet(wallet)
  }

  const onChangeNetwork = async () => {
    const currentNetwork = n20_wallet?.btc_wallet?.network
    switch (currentNetwork) {
      case 'BTCtestnet':
        n20_wallet?.btc_wallet?.switchNetwork('BTClivenet')
        break
      case 'BTClivenet':
        n20_wallet?.btc_wallet?.switchNetwork('BTCtestnet')
        break
      case 'livenet':
        n20_wallet?.btc_wallet?.switchNetwork('testnet')
        break
      case 'testnet':
        n20_wallet?.btc_wallet?.switchNetwork('livenet')
        break
    }
    window.location.reload()
  }

  const onConnectError = async (error: any) => {
    alert('n20-connect connect error' + error)
  }

  const onDisconnectSuccess = async () => {
    n20_wallet = undefined
  }

  const onDeploy = async () => {
    if (n20_wallet == undefined) {
      alert('Please connect to your wallet first.')
      return false
    }

    const send_button = document.getElementById('deploy') as HTMLButtonElement
    const result_box = document.getElementById('result') as HTMLDivElement
    const notic_box = document.getElementById('notice') as HTMLDivElement

    // get input values
    const tick = (document.getElementById('tick') as HTMLInputElement).value
    const supply = (document.getElementById('supply') as HTMLInputElement).value
    const dec = (document.getElementById('dec') as HTMLInputElement).value
    const lim = (document.getElementById('lim') as HTMLInputElement).value
    const bitwork = (document.getElementById('bitwork') as HTMLInputElement).value
    const contract = n20_sch
    const start = (document.getElementById('start') as HTMLInputElement).value
    const desc = (document.getElementById('desc') as HTMLInputElement).value
    const logo = (document.getElementById('logo') as HTMLInputElement).value
    const web = (document.getElementById('web') as HTMLInputElement).value

    send_button.disabled = true

    try {
      const res = await n20_wallet.deployToken(
        tick,
        Number(supply),
        Number(lim),
        Number(dec),
        bitwork.length > 0 ? bitwork : '20',
        start.length > 0 ? Number[start] : undefined,
        contract,
        desc.length > 0 ? desc : undefined,
        logo.length > 0 ? logo : undefined,
        web.length > 0 ? web : undefined
      )
      if (res.result.success) {
        notic_box.innerHTML = tick + ' deployed successfully.'
        result_box.innerHTML =
          '<a href=' +
          interpolate(n20_wallet.config.explorer[0].tx, { txId: res.result.txId }) +
          ' target="_blank">txId:' +
          res.result.txId +
          '</a></br>'
      } else {
        notic_box.innerHTML = tick + ' deploy failed:</br>'
        notic_box.innerHTML += res.result.error.message
        result_box.innerHTML = ''
      }
    } catch (error) {
      console.log(error)
      notic_box.innerHTML = error.toString()
      result_box.innerHTML = ''
    }

    send_button.disabled = false
    return false
  }

  const onChange = (selectedOption) => {
    n20_sch = selectedOption.value
  }

  return (
    <>
      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        <div className="space-y-2 pb-8 pt-6 md:space-y-5">
          <p className="text-md leading-7 text-gray-500 dark:text-gray-400">
            {t('site_description')}
          </p>
        </div>
      </div>

      <div className="... flex flex-col">
        <div>
          <div className="flex flex-row">
            <div className="basis-3/4">
              {n20_wallet === undefined && (
                <div className="font-mono text-sm text-gray-900 dark:text-white dark:placeholder-gray-400">
                  {t('connect_wallet')}
                </div>
              )}
            </div>
            <div className="basis-1/4">
              <div className="continer">
                <WalletConnectReact
                  config={{
                    network: 'BTCtestnet',
                    defaultConnectorId: 'chainbow',
                  }}
                  theme={resolvedTheme === 'dark' ? 'dark' : 'light'}
                  onConnectSuccess={onConnectSuccess}
                  onConnectError={onConnectError}
                  onDisconnectSuccess={onDisconnectSuccess}
                />
              </div>
              {n20_wallet !== undefined && (
                <div className="text-center font-medium text-blue-500 underline">
                  <a onClick={() => onChangeNetwork()} href="/">
                    {n20_wallet.btc_wallet.network}
                  </a>
                </div>
              )}
            </div>
          </div>
          <br></br>
          <div>
            <form>
              <div className="mb-4 w-full rounded-lg border border-gray-200 bg-gray-50 dark:border-gray-600 dark:bg-gray-700">
                <div className="rounded-t-lg bg-white px-4 py-2 dark:bg-gray-800">
                  <div className="h-8 w-full bg-white px-0 pt-2 font-sans text-sm text-gray-900 dark:bg-gray-800 dark:text-white">
                    {t('tick')}:
                  </div>
                  <input
                    id="tick"
                    className="pt-2border-1 h-8 w-full bg-white px-0 font-sans text-sm text-gray-900 focus:ring-0 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400"
                    required
                  ></input>
                  <div className="h-8 w-full bg-white px-0 pt-2 font-sans text-sm text-gray-900 dark:bg-gray-800 dark:text-white">
                    {t('supply')}
                  </div>
                  <input
                    id="supply"
                    className="border-1 h-8 w-full bg-white px-0 font-sans text-sm text-gray-900 focus:ring-0 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400"
                    required
                  ></input>
                  <div className="h-8 w-full bg-white px-0 pt-2 font-sans text-sm text-gray-900 dark:bg-gray-800 dark:text-white">
                    {t('dec')}
                  </div>
                  <input
                    id="dec"
                    className="border-1 h-8 w-full bg-white px-0 font-sans text-sm text-gray-900 focus:ring-0 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400"
                    required
                  ></input>
                  <div className="h-8 w-full bg-white px-0 pt-2 font-sans text-sm text-gray-900 dark:bg-gray-800 dark:text-white">
                    {t('lim')}
                  </div>
                  <input
                    id="lim"
                    className="border-1 h-8 w-full bg-white px-0 font-sans text-sm text-gray-900 focus:ring-0 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400"
                    required
                  ></input>
                  <div className="h-8 w-full bg-white px-0 pt-2 font-sans text-sm text-gray-900 dark:bg-gray-800 dark:text-white">
                    {t('bitwork')}
                  </div>
                  <input
                    id="bitwork"
                    className="border-1 h-8 w-full bg-white px-0 font-sans text-sm text-gray-900 focus:ring-0 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400"
                  ></input>
                  <div className="h-8 w-full bg-white px-0 pt-2 font-sans text-sm text-gray-900 dark:bg-gray-800 dark:text-white">
                    {t('contract')}
                  </div>
                  {n20_wallet !== undefined && Contracts(n20_wallet, onChange)}
                  <div className="h-8 w-full bg-white px-0 pt-2 font-sans text-sm text-gray-900 dark:bg-gray-800 dark:text-white">
                    {t('start')}
                  </div>
                  <input
                    id="start"
                    className="border-1 h-8 w-full bg-white px-0 font-sans text-sm text-gray-900 focus:ring-0 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400"
                  ></input>
                  <div className="h-8 w-full bg-white px-0 pt-2 font-sans text-sm text-gray-900 dark:bg-gray-800 dark:text-white">
                    {t('desc')}
                  </div>
                  <input
                    id="desc"
                    className="border-1 h-8 w-full bg-white px-0 font-sans text-sm text-gray-900 focus:ring-0 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400"
                  ></input>
                  <div className="h-8 w-full bg-white px-0 pt-2 font-sans text-sm text-gray-900 dark:bg-gray-800 dark:text-white">
                    {t('logo')}
                  </div>
                  <input
                    id="logo"
                    className="border-1 h-8 w-full bg-white px-0 font-sans text-sm text-gray-900 focus:ring-0 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400"
                  ></input>
                  <div className="h-8 w-full bg-white px-0 pt-2 font-sans text-sm text-gray-900 dark:bg-gray-800 dark:text-white">
                    {t('web')}
                  </div>
                  <input
                    id="web"
                    className="border-1 h-8 w-full bg-white px-0 font-sans text-sm text-gray-900 focus:ring-0 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400"
                  ></input>
                </div>
                <div className="flex items-center justify-center border-t px-3 py-2 dark:border-gray-600">
                  <button
                    id="deploy"
                    type="button"
                    className="inline-flex items-center rounded-lg bg-blue-700 px-16 py-2.5 text-center font-medium text-white hover:bg-blue-800 focus:ring-4 focus:ring-blue-200 disabled:cursor-not-allowed disabled:bg-gray-800 dark:focus:ring-blue-900"
                    onClick={() => onDeploy()}
                  >
                    <svg
                      className="-ms-1 me-2 h-4 w-4"
                      aria-hidden="true"
                      focusable="false"
                      data-prefix="fab"
                      data-icon="bitcoin"
                      role="img"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 512 512"
                    >
                      <path
                        fill="currentColor"
                        d="M504 256c0 136.1-111 248-248 248S8 392.1 8 256 119 8 256 8s248 111 248 248zm-141.7-35.33c4.937-32.1-20.19-50.74-54.55-62.57l11.15-44.7-27.21-6.781-10.85 43.52c-7.154-1.783-14.5-3.464-21.8-5.13l10.93-43.81-27.2-6.781-11.15 44.69c-5.922-1.349-11.73-2.682-17.38-4.084l.031-.14-37.53-9.37-7.239 29.06s20.19 4.627 19.76 4.913c11.02 2.751 13.01 10.04 12.68 15.82l-12.7 50.92c.76 .194 1.744 .473 2.829 .907-.907-.225-1.876-.473-2.876-.713l-17.8 71.34c-1.349 3.348-4.767 8.37-12.47 6.464 .271 .395-19.78-4.937-19.78-4.937l-13.51 31.15 35.41 8.827c6.588 1.651 13.05 3.379 19.4 5.006l-11.26 45.21 27.18 6.781 11.15-44.73a1038 1038 0 0 0 21.69 5.627l-11.11 44.52 27.21 6.781 11.26-45.13c46.4 8.781 81.3 5.239 95.99-36.73 11.84-33.79-.589-53.28-25-65.99 17.78-4.098 31.17-15.79 34.75-39.95zm-62.18 87.18c-8.41 33.79-65.31 15.52-83.75 10.94l14.94-59.9c18.45 4.603 77.6 13.72 68.81 48.96zm8.417-87.67c-7.673 30.74-55.03 15.12-70.39 11.29l13.55-54.33c15.36 3.828 64.84 10.97 56.85 43.03z"
                      ></path>
                    </svg>
                    {t('deploy')}
                  </button>
                </div>
              </div>
            </form>
          </div>
          <div className="mb-4 w-full rounded-lg border border-gray-200 bg-gray-50 dark:border-gray-600 dark:bg-gray-700">
            <div className="rounded-t-lg bg-white px-4 py-2 dark:bg-gray-800">
              <div
                className="w-full border-0 bg-white px-0 font-mono text-sm text-gray-900 focus:ring-0 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400"
                id="notice"
              >
                {t('notice')}
              </div>
            </div>
          </div>
          <div className="36 mb-4 w-full truncate rounded-lg border border-gray-200 bg-gray-50 dark:border-gray-600 dark:bg-gray-700">
            <div className="rounded-t-lg bg-white px-4 py-2 dark:bg-gray-800">
              <div
                className="text-center font-mono text-sm text-blue-500 underline"
                id="result"
              ></div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default App
