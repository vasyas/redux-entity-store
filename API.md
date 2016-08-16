## Classes

<dl>
<dt><a href="#DataOp">DataOp</a></dt>
<dd></dd>
<dt><a href="#Table">Table</a></dt>
<dd></dd>
</dl>

## Members

<dl>
<dt><a href="#loadData">loadData</a></dt>
<dd><p>Load initial data into state</p>
</dd>
</dl>

## Functions

<dl>
<dt><a href="#Session">Session()</a></dt>
<dd><p>Interface for retreiving relational data from the store.</p>
<p>Session instance is passed to the reducer functions annotated with @data.
Each</p>
</dd>
<dt><a href="#data">data()</a></dt>
<dd><p>Mark reducer action impl as data, so it would be wrapped in restore.Sesssion call
To be used with actionObject</p>
<p>ActionObject should have item name data</p>
</dd>
</dl>

<a name="DataOp"></a>

## DataOp
**Kind**: global class  
<a name="new_DataOp_new"></a>

### new DataOp(type, table, fields)
Instances of this type will be sent server side to sync backend model


| Param | Type | Description |
| --- | --- | --- |
| type | <code>string</code> | Operation type, one of CREATE, UPDATE, DELETE |
| table | <code>string</code> | name |
| fields | <code>Object</code> | for the operation |

<a name="Table"></a>

## Table
**Kind**: global class  

* [Table](#Table)
    * [new Table(rows, tableName)](#new_Table_new)
    * [~commit()](#Table..commit)

<a name="new_Table_new"></a>

### new Table(rows, tableName)
Provides access to entities of specific type in a session.

Instances of Table are constructed on session start.
Entities retreived via Table are flushed on session end.


| Param | Type | Description |
| --- | --- | --- |
| rows | <code>Array</code> | from the store state |
| tableName | <code>string</code> |  |

<a name="Table..commit"></a>

### Table~commit()
Return updated data

**Kind**: inner method of <code>[Table](#Table)</code>  
<a name="loadData"></a>

## loadData
Load initial data into state

**Kind**: global variable  
<a name="Session"></a>

## Session()
Interface for retreiving relational data from the store.

Session instance is passed to the reducer functions annotated with @data.
Each

**Kind**: global function  
<a name="data"></a>

## data()
Mark reducer action impl as data, so it would be wrapped in restore.Sesssion call
To be used with actionObject

ActionObject should have item name data

**Kind**: global function  
