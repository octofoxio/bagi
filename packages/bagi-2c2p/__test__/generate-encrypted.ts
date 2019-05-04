import * as puppeteer from 'puppeteer'
import { readFileSync } from 'fs'
import { join } from 'path'

export async function generateEncryptedCreditcard() {
  const browser = await puppeteer.launch()
  const page = await browser.newPage()
  const pageContent = readFileSync(join(__dirname, './encrypted-gen.html')).toString()
  await page.setContent(pageContent)
  await page.evaluate(() => {
    //@ts-ignore:
    My2c2p.getEncrypted('fake', function(encryptedData, errCode, errDesc) {
      console.log(encryptedData, errCode, errDesc)
      document.getElementById('result')!.innerHTML = encryptedData.encryptedCardInfo
    })
  })
  const text = await page.$eval('#result', e => e.innerHTML)
  await page.close()
  await browser.close()
  return text
}
