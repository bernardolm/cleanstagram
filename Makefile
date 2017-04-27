CONTAINER_NAME=cleanstagram
CURRENT_DOCKER=$(shell docker ps -aqf name=${CONTAINER_NAME})

start-docker:
	@if [ -z "${CURRENT_DOCKER}" ]; then \
		echo "creating docker..." && \
		docker run -it -d \
		-p 8881:8881 \
		-v `pwd`:/app \
		-w /app \
		-e "NODE_ENV=development" \
		--name=${CONTAINER_NAME} \
		node:4.5.0-slim && \
		docker exec ${CONTAINER_NAME} npm install --quiet ; \
		echo "starting docker..." && \
		docker start ${CONTAINER_NAME} > /dev/null ; \
	else \
		echo "starting docker..." && \
		docker start ${CONTAINER_NAME} > /dev/null ; \
	fi

destroy-docker:
	docker stop ${CONTAINER_NAME}
	docker rm ${CONTAINER_NAME}

hint:
	docker exec -it ${CONTAINER_NAME} node_modules/.bin/jshint main.js test/*

tests:
	docker exec -it ${CONTAINER_NAME} npm test --loglevel=error

setup:
	docker exec -it ${CONTAINER_NAME} npm install --quiet

run:
	docker exec -it ${CONTAINER_NAME} node main.js
