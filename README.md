# ping-key-value

## How to start

`sudo nodejs serv.js`

The server will start on port 4242

## How it works

![](https://habrastorage.org/webt/qk/8z/oa/qk8zoafoqwdm8qscadqjd2f_xwk.gif)

For more details please read the article [here](https://habr.com/ru/articles/762390/).

## Requests

### Create a key-value record

Send a `POST` request to address http://localhost:4242/KEY, where body is the payload, and KEY is number between 1 and 65535 

### Get value by key

Send a `GET` request to address http://localhost:4242/KEY

### Delete a key-value record

Send a `DELETE` request to address http://localhost:4242/KEY