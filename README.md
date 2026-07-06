# 中小企業診断士 暗記カードデータ作成プロジェクト

公式ページから第1次試験PDFを収集し、PDF保存、テキスト抽出、用語頻度集計、講師向けに整えた暗記カードデータ、スマホ対応カードアプリまで作るNode.jsプロジェクトです。Excelには依存しません。

対象ページ:

```text
https://www.jf-cmca.jp/contents/010_c_/shikenmondai.html
```

## できること

1. 公式ページから令和7年度から平成23年度の第1次試験PDFリンクを取得
2. 年度、科目、通常試験/再試験を判定してPDFを保存
3. PDFからテキストを抽出して `output/txt/` に保存
4. 抽出テキストから用語頻度CSVを作成
5. 断片的な抽出語を除外し、診断士試験で重要な用語に整えたカードを作成
6. スマホで触れる暗記カードアプリを生成

## 主なコマンド

この環境ではNode.jsを直接指定して実行できます。

```powershell
& 'C:\Users\user\Documents\Codex\2026-06-20\zib\work\node.exe' --use-system-ca scripts/build-data.mjs collect
& 'C:\Users\user\Documents\Codex\2026-06-20\zib\work\node.exe' --use-system-ca scripts/build-data.mjs text
& 'C:\Users\user\Documents\Codex\2026-06-20\zib\work\node.exe' --use-system-ca scripts/build-data.mjs terms
& 'C:\Users\user\Documents\Codex\2026-06-20\zib\work\node.exe' --use-system-ca scripts/build-professional-cards.mjs
& 'C:\Users\user\Documents\Codex\2026-06-20\zib\work\node.exe' --use-system-ca scripts/build-data.mjs app
```

`npm` が使える環境なら次でも動きます。

```powershell
npm run collect
npm run text
npm run terms
npm run professional
npm run app
npm run serve
```

## 出力

`output/`:

- `manifest.csv`: 収集したPDFの年度、科目、通常/再試験、URL、保存先
- `term_frequency.csv`: PDFテキストから抽出した用語候補の総頻度
- `term_by_year_subject.csv`: 用語候補の年度別・科目別頻度
- `cards.json`: アプリ用カードデータ
- `professional_cards.csv`: 講師向けに整えたカード一覧
- `pdf/`: ダウンロード済みPDF
- `txt/`: 抽出済みテキスト

`data/`:

- `cards.json`: アプリが読み込むカードデータ
- `manifest.json`: PDF収集結果

ルート:

- `standalone.html`: CSS、JS、カードデータを埋め込んだ単体アプリ

## アプリ

サーバーなしで使う場合は `standalone.html` をブラウザで開きます。

ローカルサーバーで使う場合:

```powershell
& 'C:\Users\user\Documents\Codex\2026-06-20\zib\work\node.exe' scripts/serve.mjs
```

表示URL:

```text
http://localhost:4173
```

スマホ向けに、タップで答え表示、左右スワイプで前後カード、下部ナビ、科目フィルタ、検索、既知チェックを入れています。
