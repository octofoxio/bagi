import * as React from 'react'
import Document, { Head, Main, NextScript, NextDocumentContext } from 'next/document'
import { extractStyles } from 'evergreen-ui'

export default class MyDocument extends Document {
  props: any
  static async getInitialProps(ctx: NextDocumentContext) {
    const initialProps = await Document.getInitialProps(ctx)
    const { renderPage } = ctx
    const page = renderPage()
    const { css, hydrationScript } = extractStyles()
    return {
      ...initialProps,
      ...page,
      css,
      hydrationScript
    }
  }

  render() {
    const { css, hydrationScript } = this.props
    return (
      <html>
        <Head>
          <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
          <link href="https://fonts.googleapis.com/css?family=Kanit" rel="stylesheet" />
          <style dangerouslySetInnerHTML={{ __html: css }} />
        </Head>
        <body className="root default-background-color">
          <Main />
          {hydrationScript}
          <NextScript />
        </body>
      </html>
    )
  }
}
