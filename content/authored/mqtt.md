---
cards: all
slug: mqtt
title: MQTT Tutorial
subtitle: Topics, QoS, retained messages, Last Will and sessions with Node.js
emoji: 📡
accent: #8b5cf6
category: Messaging
lessonsFile: messaging.lessons.mjs
lessonTopic: mqtt
---

# Start here

## What is MQTT in plain words?

**MQTT** is a tiny publish/subscribe protocol for devices. Clients connect to a **broker**, **publish** small messages to **topics** (like `home/kitchen/temperature`) and **subscribe** to topics they care about. It was designed for sensors on slow, unreliable networks: a 2-byte header, one long-lived connection, three delivery levels (**QoS 0, 1, 2**), **retained messages** (last known value), **Last Will** (announce a dead device) and **persistent sessions** (catch up after being offline).

It runs everywhere: factory sensors, smart homes, vehicles, phones (Facebook Messenger used it) and cloud IoT services (AWS IoT Core, Azure IoT Hub, HiveMQ, EMQX).

Follow the **Tutorial** tab to publish and subscribe for real, and try the **wildcard** and **QoS** labs in the Playground.

# MQTT reference

## What is MQTT and why does IoT use it?

**MQTT** (Message Queuing Telemetry Transport) is a tiny **publish/subscribe** protocol over TCP (port 1883, TLS on 8883, WebSockets for browsers). Its header can be just **2 bytes**, it keeps one long-lived connection, and it copes with slow, unreliable networks, which is why sensors, phones, cars and smart-home devices use it.

Parts: **clients** (publishers and subscribers) connect to a **broker** (Mosquitto, EMQX, HiveMQ, AWS IoT Core). Clients never talk to each other directly; they publish to a **topic** and the broker forwards to subscribers of that topic.

```javascript
import mqtt from 'mqtt';

const client = mqtt.connect('mqtt://localhost:1883', { clientId: 'sensor-1', clean: true });

client.on('connect', () => {
  client.subscribe('home/+/temperature', { qos: 1 });
  client.publish('home/kitchen/temperature', '21.5', { qos: 1, retain: true });
});

client.on('message', (topic, payload) => {
  console.log(topic, payload.toString());
});
```

## How do MQTT topics and wildcards work?

A topic is a path of levels separated by `/`, like `home/kitchen/temperature`. A subscription can use two wildcards:

| Wildcard | Meaning | Example filter | Matches |
|---|---|---|---|
| `+` | exactly **one** level | `home/+/temperature` | `home/kitchen/temperature`, `home/bedroom/temperature` |
| `#` | **all remaining** levels (must be last) | `home/kitchen/#` | `home/kitchen/temperature`, `home/kitchen/lights/main` |

Rules: topics are case-sensitive; never start a topic with `/`; you **cannot** publish to a wildcard; topics starting with `$` (like `$SYS/...`) are reserved for the broker and are **not** matched by a leading `#` or `+`. Test filters in the **MQTT topic wildcards** lab.

## What are MQTT QoS levels 0, 1 and 2?

QoS (Quality of Service) is chosen per publish and per subscription; the lower of the two applies for each hop.

| QoS | Guarantee | Packets | Use for |
|---|---|---|---|
| **0** | at most once, no ack | PUBLISH | frequent sensor readings where one lost value does not matter |
| **1** | at least once (duplicates possible) | PUBLISH → PUBACK | most things: commands, alerts (make handlers idempotent) |
| **2** | exactly once | PUBLISH → PUBREC → PUBREL → PUBCOMP | billing, critical commands (slowest, 4 packets) |

How QoS 1 can duplicate: the receiver gets the message but the **PUBACK is lost**, so the sender resends it with the DUP flag. QoS 2 adds a second handshake so the receiver remembers the packet id and delivers it only once. See it in the **MQTT QoS simulator**.

## What are retained messages, Last Will and persistent sessions?

- **Retained message**: the broker keeps the **last** message of a topic and gives it to every **new subscriber** immediately (great for "current state", e.g. a device's last temperature or `online`/`offline`). Clear it by publishing an empty retained payload.
- **Last Will and Testament (LWT)**: a message the client registers at connect time; the broker publishes it if the client **disconnects ungracefully**. Typical use: publish `offline` on `devices/sensor-1/status`.
- **Keep alive**: the client pings every N seconds; if the broker hears nothing for ~1.5 × N it declares the client dead and sends the LWT.
- **Persistent session** (`clean: false` / MQTT 5 `sessionExpiryInterval`) with a fixed `clientId`: the broker stores subscriptions and queued QoS 1/2 messages while the client is offline and delivers them on reconnect.

```javascript
const client = mqtt.connect(url, {
  clientId: 'sensor-1',
  clean: false,                                   // keep the session
  keepalive: 30,
  will: { topic: 'devices/sensor-1/status', payload: 'offline', qos: 1, retain: true },
});
client.on('connect', () => client.publish('devices/sensor-1/status', 'online', { qos: 1, retain: true }));
```

## What is new in MQTT 5?

Reason codes on acks, **user properties** (metadata headers), **message expiry**, **session expiry**, **shared subscriptions** (`$share/group/topic` load-balances a topic across a group of subscribers, like a work queue), topic aliases, request/response (`responseTopic`, `correlationData`) and better error reporting.

## How do you secure and scale MQTT?

- Use **TLS** (8883), never send passwords over plain 1883 on the internet. Authenticate with username/password, **client certificates** or tokens (JWT/OAuth); restrict what each client may publish or subscribe to with **ACLs** (e.g. a device may only publish to `devices/<its id>/#`).
- Scale with a **clustered broker** (EMQX, HiveMQ, VerneMQ) behind a load balancer; use **shared subscriptions** for backend consumers.
- Bridge to other systems: broker rules or a bridge service forward MQTT into **Kafka**, databases or HTTP.
- Browsers connect over **MQTT over WebSockets**.

## MQTT vs HTTP: why not just use HTTP?

HTTP is request/response: devices would have to **poll**, each request has big headers and a new handshake, and the server cannot push to a device behind NAT. MQTT keeps one small, always-open connection, **pushes** data both ways, has built-in delivery guarantees, a last-will for presence and uses far less bandwidth and battery.
