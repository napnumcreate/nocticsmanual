# ベースイメージ
FROM nginx:alpine

# ドキュメントルートにmanual/docsをコピー
COPY manual/docs /usr/share/nginx/html

# ポート80を公開
EXPOSE 80