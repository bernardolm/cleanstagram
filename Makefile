CONTAINER_NAME=cleanstagram
CURRENT_DOCKER=$(shell docker ps -aqf name=${CONTAINER_NAME})

start-docker:
	@echo "checking docker container ${CONTAINER_NAME}..."
	@echo "CURRENT_DOCKER is ${CURRENT_DOCKER}"
	@if [ -z "${CURRENT_DOCKER}" ]; then \
		echo "creating docker..." && \
		docker run -it -d \
		-p 8881:8881 \
		-v `pwd`:/app \
		-w /app \
		-e "NODE_ENV=development" \
		--name=${CONTAINER_NAME} \
		kkarczmarczyk/node-yarn && \
		sleep 2 && \
		echo "starting docker..." && \
		docker start ${CONTAINER_NAME} > /dev/null; \
	else \
		echo "starting docker..." && \
		docker start ${CONTAINER_NAME} > /dev/null; \
	fi

destroy-docker:
	-docker stop ${CONTAINER_NAME}
	-docker rm ${CONTAINER_NAME}

hint:
	docker exec -it ${CONTAINER_NAME} node_modules/.bin/jshint main.js test/*

tests:
	docker exec -it ${CONTAINER_NAME} yarn test --loglevel=error

setup:
	docker exec -it ${CONTAINER_NAME} yarn install

run:
	docker exec -it ${CONTAINER_NAME} node main.js

cache-clean:
	docker exec -it ${CONTAINER_NAME} yarn cache clean
