all:  pack

i18n:
	ng extract-i18n  --output-path src/locale/
	cd src/locale && go run i18n.go && cd ../../

pack:
	#ng build --prod --aot --build-optimizer --localize --base-href=/mail/
	ng build --prod --aot --optimization --build-optimizer --localize
	#rm -rf ../restdoc-server/restdoc/*
	cp -r dist/restdoc/* ../restdoc-server/restdoc/
	#rm -rf ../restdoc-server/static/restdoc/assets  && cp -r dist/restdoc/en-US/assets ../restdoc-server/static/restdoc/assets
	#cp -r dist/restdoc/en-US/assets ../restdoc-server/static/restdoc/assets

zh:
	ng serve --live-reload --port=4208 --configuration=zh-hans

run:
	ng serve --live-reload --port=4208
