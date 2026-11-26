# More interview questions

## What is the MQTT keep-alive, and what is client takeover?

The **keep-alive** interval (seconds) is how often a client must send some packet (usually a PINGREQ); if the broker hears nothing for about **1.5 × keep-alive**, it treats the client as dead and publishes its **Last Will**. **Client takeover** happens when a second client connects with the **same client id**: the broker disconnects the old connection and accepts the new one. Duplicate client ids (copy-pasted config) are a classic cause of "connection keeps flapping".

## What are shared subscriptions in MQTT 5?

A subscription to `$share/<group>/<topic>` makes the broker **distribute** matching messages **across the members of the group** (each message goes to one member) instead of copying it to every subscriber. It turns MQTT into a **work queue** for backend consumers: run several instances of a service in the same group to load-balance a busy topic. Ordering across members is not guaranteed.

## How is message ordering handled in MQTT?

For one publisher, one topic and one subscriber, messages arrive **in order** at the same QoS. Ordering can break with **QoS 1/2 retransmissions**, multiple publishers, shared subscriptions, or broker clusters that route messages through different nodes. If order matters, include a **sequence number or timestamp** in the payload and let the receiver reorder or ignore stale messages.

## How do retained messages and Last Will work together for presence?

On connect, the device publishes **`online`** to `devices/<id>/status` with `retain: true`, and registers a **will** of **`offline`** (also retained) on the same topic. New subscribers instantly receive the **latest status** (retained), and if the device vanishes without a clean disconnect the broker publishes the will, flipping the retained value to `offline`. On a clean disconnect, publish `offline` yourself.

## What are good practices for designing MQTT topics?

Use a **hierarchy from general to specific** (`site/building/room/device/measurement`), lowercase and no spaces; **do not** start with `/`; avoid using the payload to carry what the topic already says; put the **device id** in the topic so ACLs can restrict each device to `devices/<its-id>/#`; keep topics reasonably short; use separate **command** and **state** topics (`…/set` and `…/state`); and never put secrets or personal data in topic names.

## How do you use MQTT from a browser?

Browsers cannot open raw TCP sockets, so use **MQTT over WebSockets** (`ws://` or `wss://`): the broker exposes a WebSocket listener (EMQX, Mosquitto, HiveMQ support it) and you use MQTT.js in the page. Authenticate with a short-lived token (JWT) rather than a shared password, use **TLS**, and restrict the client with ACLs so it can only subscribe to its own topics.

## How do you secure an MQTT deployment?

Use **TLS** everywhere; authenticate clients with **username/password**, **client certificates (mutual TLS)** or **JWT/OAuth tokens**; authorise with **ACLs** per client and topic (publish and subscribe separately); disable anonymous access; rate-limit connections and message size; keep the broker patched and not exposed to the internet without a gateway; and log and monitor unusual publish rates and failed logins. Never reuse one credential across devices.

## How do MQTT brokers scale to millions of connections?

They are built on **lightweight concurrency** (Erlang/BEAM in EMQX/VerneMQ, or async I/O in HiveMQ), keep each connection's state small, and run as a **cluster** where nodes share the subscription table and forward messages between nodes. Put a **TCP load balancer** in front, use **shared subscriptions** for backend consumers, bridge or forward data to Kafka for processing, and tune OS limits (file descriptors, kernel buffers). Plan for reconnect storms after an outage (jittered backoff on clients).

## What changed between MQTT 3.1.1 and MQTT 5?

MQTT 5 adds **reason codes** (clear failure reasons for acks and disconnects), **user properties** (metadata headers), **session and message expiry**, **shared subscriptions**, **topic aliases** (shorter packets), **request/response** (`responseTopic`, `correlationData`), flow control (`receiveMaximum`), enhanced authentication, and **clean start** replacing the older clean-session flag. Most new projects should choose MQTT 5 if brokers and clients support it.

## How do you handle devices that are offline for a long time?

Use a **persistent session** (`clean: false` and a stable client id, or MQTT 5 `sessionExpiryInterval`) so the broker queues **QoS 1/2** messages, but **limit** the queue size and expiry (an offline device can otherwise fill broker memory), set **message expiry** for stale commands, publish important state as **retained**, and make devices **resync** on reconnect (ask for the latest state) instead of relying on every missed message.

## MQTT vs AMQP vs CoAP: when would you use each?

**MQTT**: lightweight pub/sub for constrained devices and unreliable networks, simple topics and QoS. **AMQP** (RabbitMQ): richer routing (exchanges, queues, bindings), transactions and acknowledgements, aimed at enterprise messaging between servers. **CoAP**: a REST-like protocol over **UDP** for very constrained devices and local networks, with request/response and observe. Many IoT systems use MQTT at the edge and AMQP or Kafka in the backend.
