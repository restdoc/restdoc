all:  pack

i18n:
	ng extract-i18n  --output-path src/locale/
	cd src/locale && go run i18n.go && cd ../../

pack:
	ng build --aot --optimization --build-optimizer --localize
	mv dist/restdoc/en-US dist/restdoc/en-us  # rename
	rm -rf ../restdoc-server/restdoc/*
	cp -r dist/restdoc/* ../restdoc-server/restdoc/

zh:
	ng serve --live-reload --port=4208 --configuration=zh-hans

run:
	ng serve --live-reload --port=4208
