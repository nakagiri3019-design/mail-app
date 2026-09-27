# sbi-app 口座別PWAのインストール手順

`?user=<id>` を付けて開くと、`index.html` の `<head>` のスクリプトが
`<link rel="manifest">` を `manifest-<id>.json` に差し替え、その口座専用のPWAとしてインストールできる。

| No | 口座 id  | ホーム画面の名前 | URL |
|----|----------|------------------|-----|
| 1  | nakagiri | 法人口座1 | https://nakagiri3019-design.github.io/mail-app/sbi-app/?user=nakagiri |
| 2  | avantia  | 法人口座2 | https://nakagiri3019-design.github.io/mail-app/sbi-app/?user=avantia |
| 3  | efstyle  | 法人口座3 | https://nakagiri3019-design.github.io/mail-app/sbi-app/?user=efstyle |
| 4  | mentor   | 法人口座4 | https://nakagiri3019-design.github.io/mail-app/sbi-app/?user=mentor |
| 5  | levanta  | 法人口座5 | https://nakagiri3019-design.github.io/mail-app/sbi-app/?user=levanta |
| 7  | vaion    | 法人口座7 | https://nakagiri3019-design.github.io/mail-app/sbi-app/?user=vaion |
| 8  | sys      | 法人口座8 | https://nakagiri3019-design.github.io/mail-app/sbi-app/?user=sys |
| 9  | eightrun | 法人口座9 | https://nakagiri3019-design.github.io/mail-app/sbi-app/?user=eightrun |

- 6（mediafounder）は欠番。`?user=mediafounder` や `?user=` なしは従来の `manifest.json`（「法人口座」、起動すると中桐）のまま。
- iOS は `apple-mobile-web-app-title` も同じ名前に書き換わる。Safari の共有メニュー →「ホーム画面に追加」で入れる。

## Android でのインストール手順

1. 既存の「法人口座」PWA があれば、先にアンインストールする（アイコン長押し → アンインストール）。
2. Chrome で上の表の URL を開き、メニュー →「アプリをインストール」。
3. 口座の数だけ 2 を繰り返す。ホーム画面に「法人口座1〜9」（6を除く）が並ぶ。

## うまくいかないとき

8つのPWAはすべて同じ scope（`/mail-app/sbi-app/`）なので、Android の Chrome が
「インストール済みアプリの範囲内」と判断して、メニューに「インストール」ではなく
「アプリで開く」を出すことがある。

- 既存の「法人口座」PWA を消し忘れていないか確認する。
- TWA（`com.arklabo.sbidemo`）が入っている場合は、それもアンインストールしてから試す。
- Chrome の「サイトの設定」でデータを削除するか、ページを再読み込みして、新しい manifest を読み直させる。
- それでも2つ目以降が入らない場合は、口座ごとにフォルダ（例：`sbi-app/u/eightrun/`）を分けて scope を別にする必要がある。

## 口座を追加するとき

1. 既存の `manifest-<id>.json` をコピーし、`id`・`start_url`・`name`・`short_name` を書き換える。
2. `index.html` の `<head>` にある `PWA_NO` に `id: 番号` を追加する。
3. `sw.js` の `PRECACHE_URLS` に追加し、`CACHE_NAME` をバンプする。
