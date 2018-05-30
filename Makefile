CONTAINER_NAME=cleanstagram
CURRENT_DOCKER=$(shell docker ps -aqf name=${CONTAINER_NAME})
PWD=$(shell pwd)

build:
ifeq ($(shell docker images -q ${CONTAINER_NAME} 2> /dev/null | wc -l),0)
	docker build --force-rm . -t ${CONTAINER_NAME}
endif

start: build
	docker run --rm \
		-v ${PWD}:/usr/app \
		-p 8881:8881 \
		-w /usr/app \
		--name ${CONTAINER_NAME} \
		${CONTAINER_NAME}

destroy: stop
	-docker rm ${CONTAINER_NAME}
	-docker rmi ${CONTAINER_NAME}

hint: start
	docker exec -it ${CONTAINER_NAME} ./node_modules/.bin/jshint main.js test/*

tests: start
	docker exec -it ${CONTAINER_NAME} ./node_modules/.bin/mocha --reporter nyan --timeout 15000

setup: start
	docker exec -it ${CONTAINER_NAME} yarn

stop:
	-docker stop ${CONTAINER_NAME}

restart: stop start

cache-clean: start
	docker exec -it ${CONTAINER_NAME} yarn cache clean
