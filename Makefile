CONTAINER_NAME=cleanstagram
CURRENT_DOCKER=$(shell docker ps -aqf name=${CONTAINER_NAME})
PWD=$(shell pwd)

build-docker:
ifeq ($(shell docker images -q ${CONTAINER_NAME} 2> /dev/null | wc -l),0)
	docker build --force-rm . -t ${CONTAINER_NAME}
endif

start-docker: build-docker
	docker run --rm \
		-v ${PWD}:${HOME}/app \
		-p 8881:8881 \
		-w ~/app \
		--name ${CONTAINER_NAME} \
		${CONTAINER_NAME}

destroy-docker:
	-docker stop ${CONTAINER_NAME}
	-docker rm ${CONTAINER_NAME}

hint: start-docker
	docker exec -it ${CONTAINER_NAME} ./node_modules/.bin/jshint main.js test/*

tests: start-docker
	docker exec -it ${CONTAINER_NAME} ./node_modules/.bin/mocha --reporter nyan --timeout 15000

setup: start-docker
	docker exec -it ${CONTAINER_NAME} yarn

run: start-docker
	docker exec -it ${CONTAINER_NAME} node main.js

cache-clean: start-docker
	docker exec -it ${CONTAINER_NAME} yarn cache clean
